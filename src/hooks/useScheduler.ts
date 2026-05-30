import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { get, set, del } from 'idb-keyval';
import type {
  ClassSection,
  Constraints,
  DayOfWeek,
  ParsedTKB,
  ScoredSchedule,
  SolverProgress,
  SolverResult,
} from '@/types/scheduler';
import { DEFAULT_MAX_RESULTS, MAX_MAX_RESULTS, MIN_MAX_RESULTS } from '@/types/scheduler';
import { parseWorkbook, parseWorkbookFromArrayBuffer } from '@/utils/tkb/parseExcel';
import type { SolverWorkerMessage, SolverWorkerRequest } from '@/utils/tkb/solver.worker';
import { solve } from '@/utils/tkb/solver';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const CACHE_KEY = 'tkb:cache:v1';

const defaultConstraints: Constraints = {
  dayOff: [],
  avoidSlots: [],
  preferMorning: true,
  allowOnline: true,
  programs: [],
};

export interface SavedPlan {
  id: string;
  name: string;
  semester: string;
  sections: ClassSection[];
  createdAt: string;
}

export const useScheduler = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [parsed, setParsed] = useState<ParsedTKB | null>(null);
  const [loadingCache, setLoadingCache] = useState(true);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [constraints, setConstraints] = useState<Constraints>(defaultConstraints);
  const [maxResults, setMaxResultsRaw] = useState<number>(DEFAULT_MAX_RESULTS);
  const [result, setResult] = useState<SolverResult | null>(null);
  const [progress, setProgress] = useState<SolverProgress | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    let alive = true;
    get<ParsedTKB>(CACHE_KEY)
      .then((cached) => {
        if (alive && cached) setParsed(cached);
      })
      .catch((err) => console.error('Failed to load cached TKB:', err))
      .finally(() => {
        if (alive) setLoadingCache(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const persist = useCallback(async (next: ParsedTKB) => {
    await set(CACHE_KEY, next);
  }, []);

  const parseFile = useCallback(
    async (file: File) => {
      const next = await parseWorkbook(file);
      setParsed(next);
      await persist(next);
      return next;
    },
    [persist],
  );

  const loadSampleFromUrl = useCallback(
    async (url: string, sourceName: string) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Không tải được file mẫu.');
      const buffer = await response.arrayBuffer();
      const next = parseWorkbookFromArrayBuffer(buffer, sourceName);
      setParsed(next);
      await persist(next);
      return next;
    },
    [persist],
  );

  const clearCache = useCallback(async () => {
    await del(CACHE_KEY);
    setParsed(null);
    setResult(null);
  }, []);

  const toggleCourse = useCallback((code: string) => {
    setSelectedCodes((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  }, []);

  const removeCourse = useCallback((code: string) => {
    setSelectedCodes((prev) => prev.filter((c) => c !== code));
  }, []);

  const toggleDayOff = useCallback((day: DayOfWeek) => {
    setConstraints((prev) => ({
      ...prev,
      dayOff: prev.dayOff.includes(day) ? prev.dayOff.filter((d) => d !== day) : [...prev.dayOff, day],
    }));
  }, []);

  const setBooleanConstraint = useCallback((key: 'preferMorning' | 'allowOnline', value: boolean) => {
    setConstraints((prev) => ({ ...prev, [key]: value }));
  }, []);

  const togglePrograms = useCallback((program: string) => {
    setConstraints((prev) => ({
      ...prev,
      programs: prev.programs.includes(program)
        ? prev.programs.filter((p) => p !== program)
        : [...prev.programs, program],
    }));
  }, []);

  const setMaxResults = useCallback((value: number) => {
    if (!Number.isFinite(value)) return;
    const clamped = Math.max(MIN_MAX_RESULTS, Math.min(MAX_MAX_RESULTS, Math.round(value)));
    setMaxResultsRaw(clamped);
  }, []);

  const availablePrograms = useMemo(() => {
    if (!parsed) return [] as { name: string; count: number }[];
    const map = new Map<string, number>();
    for (const s of parsed.sections) {
      if (!s.program) continue;
      map.set(s.program, (map.get(s.program) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [parsed]);

  const courseCatalog = useMemo(() => {
    if (!parsed) return [] as { code: string; name: string; credits: number; sectionCount: number }[];
    const programWhitelist = constraints.programs.length > 0 ? new Set(constraints.programs) : null;
    const map = new Map<string, { code: string; name: string; credits: number; sectionCount: number }>();
    for (const s of parsed.sections) {
      if (programWhitelist && s.program && !programWhitelist.has(s.program)) continue;
      const entry = map.get(s.courseCode);
      if (entry) entry.sectionCount += 1;
      else
        map.set(s.courseCode, {
          code: s.courseCode,
          name: s.courseName,
          credits: s.credits,
          sectionCount: 1,
        });
    }
    return [...map.values()].sort((a, b) => a.code.localeCompare(b.code));
  }, [parsed, constraints.programs]);

  useEffect(() => {
    if (!parsed) return;
    if (constraints.programs.length > 0) return;
    if (availablePrograms.length === 0) return;
    const preferred = availablePrograms.find((p) => p.name === 'CT CHUẨN')?.name ?? availablePrograms[0].name;
    setConstraints((prev) => ({ ...prev, programs: [preferred] }));
  }, [parsed, availablePrograms, constraints.programs.length]);

  const runSolve = useCallback(() => {
    if (!parsed) {
      setError('Chưa có dữ liệu TKB. Vui lòng upload file Excel.');
      return;
    }
    if (selectedCodes.length === 0) {
      setError('Hãy chọn ít nhất 1 mã học phần.');
      return;
    }
    setError(null);
    setRunning(true);
    setResult(null);
    setProgress({ explored: 0, found: 0 });

    let worker: Worker | null = null;
    try {
      worker = new Worker(new URL('../utils/tkb/solver.worker.ts', import.meta.url), { type: 'module' });
    } catch (err) {
      console.warn('Worker unavailable, falling back to main thread:', err);
    }

    if (!worker) {
      try {
        const res = solve(parsed.sections, selectedCodes, constraints, {
          maxResults,
          onProgress: (p) => setProgress(p),
        });
        setResult(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setRunning(false);
      }
      return;
    }

    workerRef.current?.terminate();
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<SolverWorkerMessage>) => {
      const msg = event.data;
      if (msg.kind === 'progress') {
        setProgress(msg.progress);
      } else if (msg.kind === 'done') {
        setResult(msg.result);
        setRunning(false);
        worker?.terminate();
        if (workerRef.current === worker) workerRef.current = null;
      } else if (msg.kind === 'error') {
        setError(msg.message);
        setRunning(false);
        worker?.terminate();
        if (workerRef.current === worker) workerRef.current = null;
      }
    };

    worker.onerror = (event) => {
      setError(event.message || 'Lỗi worker.');
      setRunning(false);
      worker?.terminate();
      if (workerRef.current === worker) workerRef.current = null;
    };

    const payload: SolverWorkerRequest = {
      sections: parsed.sections,
      selectedCodes,
      constraints,
      maxResults,
    };
    worker.postMessage(payload);
  }, [parsed, selectedCodes, constraints, maxResults]);

  const cancelSolve = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setRunning(false);
  }, []);

  const loadSavedPlans = useCallback(async () => {
    if (!user) {
      setSavedPlans([]);
      return;
    }
    setLoadingSaved(true);
    const { data, error: dbError } = await supabase
      .from('schedule_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setLoadingSaved(false);
    if (dbError) {
      console.error('Load saved plans failed:', dbError);
      return;
    }
    if (data) {
      setSavedPlans(
        data.map((row) => ({
          id: row.id,
          name: row.name,
          semester: row.semester,
          sections: (row.sections as unknown as ClassSection[]) ?? [],
          createdAt: row.created_at,
        })),
      );
    }
  }, [user]);

  useEffect(() => {
    void loadSavedPlans();
  }, [loadSavedPlans]);

  const savePlan = useCallback(
    async (schedule: ScoredSchedule, name: string) => {
      if (!user) {
        toast({
          title: 'Cần đăng nhập',
          description: 'Đăng nhập để lưu phương án TKB.',
          variant: 'destructive',
        });
        return;
      }
      const semester = parsed?.semester ?? '';
      const { error: dbError } = await supabase.from('schedule_plans').insert({
        user_id: user.id,
        name,
        semester,
        sections: schedule.sections as unknown,
      });
      if (dbError) {
        toast({ title: 'Lưu thất bại', description: dbError.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Đã lưu', description: `Phương án "${name}" đã được lưu.` });
      await loadSavedPlans();
    },
    [user, parsed, toast, loadSavedPlans],
  );

  const deletePlan = useCallback(
    async (id: string) => {
      if (!user) return;
      const { error: dbError } = await supabase.from('schedule_plans').delete().eq('id', id).eq('user_id', user.id);
      if (dbError) {
        toast({ title: 'Xóa thất bại', description: dbError.message, variant: 'destructive' });
        return;
      }
      await loadSavedPlans();
    },
    [user, toast, loadSavedPlans],
  );

  return {
    parsed,
    loadingCache,
    parseFile,
    loadSampleFromUrl,
    clearCache,
    selectedCodes,
    toggleCourse,
    removeCourse,
    setSelectedCodes,
    constraints,
    toggleDayOff,
    setBooleanConstraint,
    setConstraints,
    togglePrograms,
    maxResults,
    setMaxResults,
    availablePrograms,
    courseCatalog,
    runSolve,
    cancelSolve,
    running,
    progress,
    result,
    error,
    savedPlans,
    loadingSaved,
    savePlan,
    deletePlan,
    reloadSaved: loadSavedPlans,
  };
};

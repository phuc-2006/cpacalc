import type {
  ClassSection,
  Constraints,
  CourseGroup,
  DayOfWeek,
  ScoredSchedule,
  SolverDiagnostics,
  SolverProgress,
  SolverResult,
} from '@/types/scheduler';
import { ALL_DAYS } from '@/types/scheduler';
import { indexSection, IndexedSection, sectionsConflict } from './conflict';

export interface SolverOptions {
  maxResults?: number;
  maxNodes?: number;
  onProgress?: (p: SolverProgress) => void;
  progressIntervalMs?: number;
}

const DEFAULT_OPTIONS: Required<Omit<SolverOptions, 'onProgress'>> = {
  maxResults: 50,
  maxNodes: 500_000,
  progressIntervalMs: 80,
};

function defaultConstraints(): Constraints {
  return { dayOff: [], avoidSlots: [], preferMorning: true, allowOnline: true, programs: [] };
}

function meetingSignature(section: ClassSection): string {
  const parts = section.meetings.map((m) => {
    const weeks = [...m.weeks].sort((a, b) => a - b).join(',');
    return `${m.day}|${m.startSlot}-${m.endSlot}|${weeks}`;
  });
  parts.sort();
  return parts.join(';');
}

function bundleSignature(bundle: ClassSection[]): string {
  return bundle.map(meetingSignature).sort().join('//');
}

function dedupBundles(bundles: ClassSection[][]): ClassSection[][] {
  const seen = new Map<string, ClassSection[]>();
  for (const bundle of bundles) {
    const sig = bundleSignature(bundle);
    const existing = seen.get(sig);
    if (!existing) {
      seen.set(sig, bundle.map((section) => ({ ...section, equivalentClassIds: [section.classId] })));
      continue;
    }
    for (let i = 0; i < bundle.length; i++) {
      const list = existing[i].equivalentClassIds ?? [existing[i].classId];
      if (!list.includes(bundle[i].classId)) list.push(bundle[i].classId);
      existing[i].equivalentClassIds = list;
    }
  }
  return [...seen.values()];
}

export function buildCourseGroups(sections: ClassSection[], selectedCodes: string[]): CourseGroup[] {
  const wanted = new Set(selectedCodes);
  const byCourse = new Map<string, ClassSection[]>();
  for (const s of sections) {
    if (!wanted.has(s.courseCode)) continue;
    const list = byCourse.get(s.courseCode) ?? [];
    list.push(s);
    byCourse.set(s.courseCode, list);
  }

  const groups: CourseGroup[] = [];
  for (const code of selectedCodes) {
    const list = byCourse.get(code);
    if (!list || list.length === 0) {
      groups.push({ courseCode: code, courseName: code, credits: 0, bundles: [] });
      continue;
    }
    const byId = new Map<string, ClassSection>(list.map((s) => [s.classId, s]));
    const parents = list.filter((s) => !s.parentClassId);
    const childrenByParent = new Map<string, ClassSection[]>();
    for (const s of list) {
      if (s.parentClassId && byId.has(s.parentClassId)) {
        const arr = childrenByParent.get(s.parentClassId) ?? [];
        arr.push(s);
        childrenByParent.set(s.parentClassId, arr);
      }
    }

    const bundles: ClassSection[][] = [];
    if (parents.length === 0) {
      for (const s of list) bundles.push([s]);
    } else {
      for (const parent of parents) {
        const kids = childrenByParent.get(parent.classId);
        if (kids && kids.length > 0) {
          for (const k of kids) bundles.push([parent, k]);
        } else {
          bundles.push([parent]);
        }
      }
    }

    groups.push({
      courseCode: code,
      courseName: list[0]?.courseName ?? code,
      credits: list[0]?.credits ?? 0,
      bundles: dedupBundles(bundles),
    });
  }
  return groups;
}

function bundleViolatesConstraints(bundle: ClassSection[], c: Constraints): boolean {
  const programWhitelist = c.programs.length > 0 ? new Set(c.programs) : null;
  for (const section of bundle) {
    if (programWhitelist && section.program && !programWhitelist.has(section.program)) return true;
    if (!c.allowOnline && section.isOnline) return true;
    for (const m of section.meetings) {
      if (c.dayOff.includes(m.day)) return true;
      for (const avoid of c.avoidSlots) {
        if (avoid.day !== m.day) continue;
        for (let s = m.startSlot; s <= m.endSlot; s++) {
          if (avoid.slots.includes(s)) return true;
        }
      }
    }
  }
  return false;
}

interface IndexedBundle {
  index: number;
  sections: IndexedSection[];
}

function indexBundle(bundle: ClassSection[], index: number): IndexedBundle {
  return { index, sections: bundle.map(indexSection) };
}

function bundlesConflict(a: IndexedBundle, b: IndexedBundle): boolean {
  for (const sa of a.sections) {
    for (const sb of b.sections) {
      if (sectionsConflict(sa, sb)) return true;
    }
  }
  return false;
}

function scoreSchedule(sections: ClassSection[]): ScoredSchedule {
  const slotsByDay = new Map<DayOfWeek, { start: number; end: number }[]>();
  let morningScore = 0;
  let totalSlots = 0;

  for (const s of sections) {
    for (const m of s.meetings) {
      const arr = slotsByDay.get(m.day) ?? [];
      arr.push({ start: m.startSlot, end: m.endSlot });
      slotsByDay.set(m.day, arr);
      totalSlots += m.endSlot - m.startSlot + 1;
      for (let p = m.startSlot; p <= m.endSlot; p++) {
        if (p <= 6) morningScore += 1;
      }
    }
  }

  const dayOffCount = ALL_DAYS.filter((d) => !slotsByDay.has(d) || slotsByDay.get(d)!.length === 0).length;

  let gapPenalty = 0;
  for (const arr of slotsByDay.values()) {
    arr.sort((x, y) => x.start - y.start);
    for (let i = 1; i < arr.length; i++) {
      const gap = arr[i].start - arr[i - 1].end - 1;
      if (gap > 0) gapPenalty += gap;
    }
  }

  return {
    sections,
    dayOffCount,
    gapPenalty,
    morningScore: totalSlots > 0 ? morningScore / totalSlots : 0,
  };
}

function diagnosePairwise(groups: CourseGroup[]): SolverDiagnostics {
  const conflictingPairs: SolverDiagnostics['conflictingPairs'] = [];
  const indexedPerGroup = groups.map((g) => g.bundles.map((b, i) => indexBundle(b, i)));
  for (let i = 0; i < groups.length; i++) {
    for (let j = i + 1; j < groups.length; j++) {
      const a = indexedPerGroup[i];
      const b = indexedPerGroup[j];
      if (a.length === 0 || b.length === 0) continue;
      let anyOk = false;
      outer: for (const ba of a) {
        for (const bb of b) {
          if (!bundlesConflict(ba, bb)) {
            anyOk = true;
            break outer;
          }
        }
      }
      if (!anyOk) {
        conflictingPairs.push({ a: groups[i].courseCode, b: groups[j].courseCode });
      }
    }
  }
  return { conflictingPairs };
}

export function solve(
  sections: ClassSection[],
  selectedCodes: string[],
  constraintsInput?: Partial<Constraints>,
  options: SolverOptions = {},
): SolverResult {
  const constraints: Constraints = { ...defaultConstraints(), ...constraintsInput };
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const baseGroups = buildCourseGroups(sections, selectedCodes);
  const filteredGroups: CourseGroup[] = baseGroups.map((g) => ({
    ...g,
    bundles: g.bundles.filter((b) => !bundleViolatesConstraints(b, constraints)),
  }));

  const missingCourses = filteredGroups.filter((g) => g.bundles.length === 0).map((g) => g.courseCode);
  if (missingCourses.length > 0) {
    return {
      schedules: [],
      diagnostics: {
        conflictingPairs: [],
        reason: `Không có lớp phù hợp ràng buộc cho môn: ${missingCourses.join(', ')}`,
      },
      totalExplored: 0,
      truncated: false,
    };
  }

  const order = [...filteredGroups]
    .map((g, originalIndex) => ({ g, originalIndex }))
    .sort((x, y) => x.g.bundles.length - y.g.bundles.length);

  const indexedGroups: IndexedBundle[][] = order.map((o) => o.g.bundles.map((b, i) => indexBundle(b, i)));

  const results: ScoredSchedule[] = [];
  let explored = 0;
  let truncated = false;
  let lastProgress = Date.now();

  const picked: IndexedBundle[] = [];

  function notifyProgress() {
    if (!opts.onProgress) return;
    const now = Date.now();
    if (now - lastProgress >= opts.progressIntervalMs) {
      lastProgress = now;
      opts.onProgress({ explored, found: results.length });
    }
  }

  function recurse(idx: number): boolean {
    if (explored >= opts.maxNodes) {
      truncated = true;
      return false;
    }
    if (results.length >= opts.maxResults) {
      truncated = true;
      return false;
    }
    if (idx === indexedGroups.length) {
      const flat: ClassSection[] = [];
      for (const b of picked) {
        for (const s of b.sections) flat.push(s.section);
      }
      results.push(scoreSchedule(flat));
      notifyProgress();
      return true;
    }
    for (const candidate of indexedGroups[idx]) {
      explored++;
      let bad = false;
      for (const chosen of picked) {
        if (bundlesConflict(candidate, chosen)) {
          bad = true;
          break;
        }
      }
      if (bad) continue;
      picked.push(candidate);
      const ok = recurse(idx + 1);
      picked.pop();
      if (!ok && (truncated || results.length >= opts.maxResults)) return false;
    }
    return true;
  }

  recurse(0);

  results.sort((a, b) => {
    if (b.dayOffCount !== a.dayOffCount) return b.dayOffCount - a.dayOffCount;
    if (a.gapPenalty !== b.gapPenalty) return a.gapPenalty - b.gapPenalty;
    if (constraints.preferMorning && a.morningScore !== b.morningScore) {
      return b.morningScore - a.morningScore;
    }
    return 0;
  });

  if (opts.onProgress) {
    opts.onProgress({ explored, found: results.length });
  }

  const diagnostics: SolverDiagnostics = results.length === 0 ? diagnosePairwise(filteredGroups) : { conflictingPairs: [] };

  return { schedules: results, diagnostics, totalExplored: explored, truncated };
}

import { useState, useEffect, useCallback } from 'react';
import { RegistrationEntry, PlannerState } from '@/types/curriculum';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const usePlannerCloud = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plannerState, setPlannerState] = useState<PlannerState>({
    selectedModule: null,
    curriculumImported: false,
  });
  const [registrations, setRegistrations] = useState<RegistrationEntry[]>([]);
  const [manualPassedCodes, setManualPassedCodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Load all planner data
  const loadData = useCallback(async () => {
    if (!user) {
      setPlannerState({ selectedModule: null, curriculumImported: false });
      setRegistrations([]);
      setManualPassedCodes(new Set());
      setLoading(false);
      return;
    }

    try {
      // Load planner state
      const { data: stateData } = await supabase
        .from('planner_state')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (stateData) {
        setPlannerState({
          selectedModule: stateData.selected_module,
          curriculumImported: stateData.curriculum_imported,
        });
      }

      // Load registrations
      const { data: regData } = await supabase
        .from('planner_registrations')
        .select('*')
        .eq('user_id', user.id);

      if (regData) {
        setRegistrations(
          regData.map((r) => ({
            id: r.id,
            semesterName: r.semester_name,
            courseCode: r.course_code,
            courseName: r.course_name,
            credits: r.credits,
          }))
        );
      }

      // Load manual passed
      const { data: manualData } = await supabase
        .from('planner_manual_passed')
        .select('*')
        .eq('user_id', user.id);

      if (manualData) {
        setManualPassedCodes(new Set(manualData.map((m) => m.course_code)));
      }
    } catch (error) {
      console.error('Error loading planner data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // -- Planner State --

  const updateSelectedModule = useCallback(
    async (moduleId: string | null) => {
      if (!user) return;
      try {
        const { data: existing } = await supabase
          .from('planner_state')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (existing) {
          await supabase
            .from('planner_state')
            .update({ selected_module: moduleId })
            .eq('user_id', user.id);
        } else {
          await supabase
            .from('planner_state')
            .insert({ user_id: user.id, selected_module: moduleId, curriculum_imported: plannerState.curriculumImported });
        }
        setPlannerState((prev) => ({ ...prev, selectedModule: moduleId }));
      } catch (error) {
        console.error('Error updating module:', error);
      }
    },
    [user, plannerState.curriculumImported]
  );

  const setCurriculumImported = useCallback(
    async (imported: boolean) => {
      if (!user) return;
      try {
        const { data: existing } = await supabase
          .from('planner_state')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (existing) {
          await supabase
            .from('planner_state')
            .update({ curriculum_imported: imported })
            .eq('user_id', user.id);
        } else {
          await supabase
            .from('planner_state')
            .insert({ user_id: user.id, curriculum_imported: imported });
        }
        setPlannerState((prev) => ({ ...prev, curriculumImported: imported }));
      } catch (error) {
        console.error('Error updating import status:', error);
      }
    },
    [user]
  );

  // -- Registrations --

  const addRegistration = useCallback(
    async (semesterName: string, courseCode: string, courseName: string, credits: number) => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('planner_registrations')
          .insert({
            user_id: user.id,
            semester_name: semesterName,
            course_code: courseCode,
            course_name: courseName,
            credits,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setRegistrations((prev) => [
            ...prev,
            {
              id: data.id,
              semesterName: data.semester_name,
              courseCode: data.course_code,
              courseName: data.course_name,
              credits: data.credits,
            },
          ]);
        }
      } catch (error) {
        console.error('Error adding registration:', error);
        toast({ title: 'Lỗi', description: 'Không thể thêm đăng ký', variant: 'destructive' });
      }
    },
    [user, toast]
  );

  const deleteRegistration = useCallback(
    async (id: string) => {
      if (!user) return;
      try {
        const { error } = await supabase
          .from('planner_registrations')
          .delete()
          .eq('id', id);

        if (error) throw error;
        setRegistrations((prev) => prev.filter((r) => r.id !== id));
      } catch (error) {
        console.error('Error deleting registration:', error);
        toast({ title: 'Lỗi', description: 'Không thể xóa đăng ký', variant: 'destructive' });
      }
    },
    [user, toast]
  );

  const deleteRegistrationsBySemester = useCallback(
    async (semesterName: string) => {
      if (!user) return;
      try {
        const { error } = await supabase
          .from('planner_registrations')
          .delete()
          .eq('user_id', user.id)
          .eq('semester_name', semesterName);

        if (error) throw error;
        setRegistrations((prev) => prev.filter((r) => r.semesterName !== semesterName));
      } catch (error) {
        console.error('Error deleting semester registrations:', error);
        toast({ title: 'Lỗi', description: 'Không thể xóa kỳ', variant: 'destructive' });
      }
    },
    [user, toast]
  );

  // -- Manual Passed --

  const toggleManualPassed = useCallback(
    async (courseCode: string) => {
      if (!user) return;
      const isCurrentlyPassed = manualPassedCodes.has(courseCode);

      try {
        if (isCurrentlyPassed) {
          const { error } = await supabase
            .from('planner_manual_passed')
            .delete()
            .eq('user_id', user.id)
            .eq('course_code', courseCode);
          if (error) throw error;
          setManualPassedCodes((prev) => {
            const next = new Set(prev);
            next.delete(courseCode);
            return next;
          });
        } else {
          const { error } = await supabase
            .from('planner_manual_passed')
            .insert({ user_id: user.id, course_code: courseCode });
          if (error) throw error;
          setManualPassedCodes((prev) => new Set(prev).add(courseCode));
        }
      } catch (error) {
        console.error('Error toggling manual passed:', error);
      }
    },
    [user, manualPassedCodes]
  );

  const setAllManualPassed = useCallback(
    async (courseCodes: string[]) => {
      if (!user) return;
      const codesToAdd = courseCodes.filter((c) => !manualPassedCodes.has(c));
      if (codesToAdd.length === 0) return;

      try {
        const inserts = codesToAdd.map((code) => ({
          user_id: user.id,
          course_code: code,
        }));
        const { error } = await supabase
          .from('planner_manual_passed')
          .upsert(inserts, { onConflict: 'user_id,course_code' });
        if (error) throw error;
        setManualPassedCodes((prev) => {
          const next = new Set(prev);
          codesToAdd.forEach((c) => next.add(c));
          return next;
        });
      } catch (error) {
        console.error('Error setting all passed:', error);
      }
    },
    [user, manualPassedCodes]
  );

  const clearAllManualPassed = useCallback(
    async (courseCodes: string[]) => {
      if (!user) return;
      try {
        for (const code of courseCodes) {
          await supabase
            .from('planner_manual_passed')
            .delete()
            .eq('user_id', user.id)
            .eq('course_code', code);
        }
        setManualPassedCodes((prev) => {
          const next = new Set(prev);
          courseCodes.forEach((c) => next.delete(c));
          return next;
        });
      } catch (error) {
        console.error('Error clearing passed:', error);
      }
    },
    [user]
  );

  return {
    plannerState,
    registrations,
    manualPassedCodes,
    loading,
    updateSelectedModule,
    setCurriculumImported,
    addRegistration,
    deleteRegistration,
    deleteRegistrationsBySemester,
    toggleManualPassed,
    setAllManualPassed,
    clearAllManualPassed,
    refetch: loadData,
  };
};

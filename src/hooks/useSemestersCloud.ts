import { useState, useEffect, useCallback } from 'react';
import { Semester, Course, SemesterResult, CoefficientPair, SemesterType } from '@/types/gpa';
import { 
  calculateSemesterResults, 
  calculateCPA, 
  calculateGPAFromMainSemesters,
  calculateFailedCredits,
  generateId 
} from '@/utils/gpaCalculator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useSemestersCloud = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from database
  const loadData = useCallback(async () => {
    if (!user) {
      setSemesters([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch semesters
      const { data: semestersData, error: semestersError } = await supabase
        .from('semesters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (semestersError) throw semestersError;

      // Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', user.id);

      if (coursesError) throw coursesError;

      // Map data to local structure
      const mappedSemesters: Semester[] = (semestersData || []).map(sem => ({
        id: sem.id,
        name: sem.name,
        type: sem.type as SemesterType,
        courses: (coursesData || [])
          .filter(c => c.semester_id === sem.id)
          .map(c => ({
            id: c.id,
            name: c.name,
            code: c.code,
            credits: c.credits,
            processScore: Number(c.process_score),
            finalScore: Number(c.final_score),
            coefficientPair: c.coefficient_pair as CoefficientPair,
          })),
      }));

      setSemesters(mappedSemesters);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải dữ liệu',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addSemester = useCallback(async (semester: Semester) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('semesters')
        .insert({
          id: semester.id,
          user_id: user.id,
          name: semester.name,
          type: semester.type,
        });

      if (error) throw error;

      setSemesters(prev => [...prev, { ...semester, courses: [] }]);
    } catch (error) {
      console.error('Error adding semester:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể thêm học kỳ',
        variant: 'destructive',
      });
    }
  }, [user, toast]);

  const deleteSemester = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('semesters')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSemesters(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting semester:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa học kỳ',
        variant: 'destructive',
      });
    }
  }, [user, toast]);

  const addCourse = useCallback(async (semesterId: string, course: Omit<Course, 'id'>) => {
    if (!user) return;

    const courseId = generateId();

    try {
      const { error } = await supabase
        .from('courses')
        .insert({
          id: courseId,
          semester_id: semesterId,
          user_id: user.id,
          name: course.name,
          code: course.code,
          credits: course.credits,
          process_score: course.processScore,
          final_score: course.finalScore,
          coefficient_pair: course.coefficientPair,
        });

      if (error) throw error;

      setSemesters(prev => prev.map(semester => {
        if (semester.id === semesterId) {
          return {
            ...semester,
            courses: [...semester.courses, { ...course, id: courseId }],
          };
        }
        return semester;
      }));
    } catch (error) {
      console.error('Error adding course:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể thêm học phần',
        variant: 'destructive',
      });
    }
  }, [user, toast]);

  const deleteCourse = useCallback(async (semesterId: string, courseId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      setSemesters(prev => prev.map(semester => {
        if (semester.id === semesterId) {
          return {
            ...semester,
            courses: semester.courses.filter(c => c.id !== courseId),
          };
        }
        return semester;
      }));
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa học phần',
        variant: 'destructive',
      });
    }
  }, [user, toast]);

  const updateCourse = useCallback(async (semesterId: string, courseId: string, updates: Partial<Course>) => {
    if (!user) return;

    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.code !== undefined) dbUpdates.code = updates.code;
      if (updates.credits !== undefined) dbUpdates.credits = updates.credits;
      if (updates.processScore !== undefined) dbUpdates.process_score = updates.processScore;
      if (updates.finalScore !== undefined) dbUpdates.final_score = updates.finalScore;
      if (updates.coefficientPair !== undefined) dbUpdates.coefficient_pair = updates.coefficientPair;

      const { error } = await supabase
        .from('courses')
        .update(dbUpdates)
        .eq('id', courseId);

      if (error) throw error;

      setSemesters(prev => prev.map(semester => {
        if (semester.id === semesterId) {
          return {
            ...semester,
            courses: semester.courses.map(course => 
              course.id === courseId ? { ...course, ...updates } : course
            ),
          };
        }
        return semester;
      }));
    } catch (error) {
      console.error('Error updating course:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật học phần',
        variant: 'destructive',
      });
    }
  }, [user, toast]);

  const importData = useCallback(async (data: Array<{ name: string; type: string; courses: Array<Omit<Course, 'id'>> }>) => {
    if (!user) return;

    try {
      for (const sem of data) {
        const semId = generateId();
        const { error: semError } = await supabase
          .from('semesters')
          .insert({ id: semId, user_id: user.id, name: sem.name, type: sem.type });
        if (semError) throw semError;

        if (sem.courses.length > 0) {
          const coursesInsert = sem.courses.map(c => ({
            id: generateId(),
            semester_id: semId,
            user_id: user.id,
            name: c.name,
            code: c.code,
            credits: c.credits,
            process_score: c.processScore,
            final_score: c.finalScore,
            coefficient_pair: c.coefficientPair,
          }));
          const { error: courseError } = await supabase.from('courses').insert(coursesInsert);
          if (courseError) throw courseError;
        }
      }

      await loadData();
    } catch (error) {
      console.error('Error importing data:', error);
      toast({ title: 'Lỗi', description: 'Không thể import dữ liệu', variant: 'destructive' });
    }
  }, [user, toast, loadData]);

  // Calculate results
  const semesterResults: SemesterResult[] = calculateSemesterResults(semesters);
  const { cpa, accumulatedCredits: cpaAccumulatedCredits } = calculateCPA(semesterResults);
  const { gpa: overallGPA, accumulatedCredits: gpaAccumulatedCredits } = calculateGPAFromMainSemesters(semesterResults);

  // Calculate failed credits using the utility function
  const { failedCredits, failedCourses } = calculateFailedCredits(semesterResults);

  return {
    semesters,
    semesterResults,
    cpa,
    cpaTotalCredits: cpaAccumulatedCredits,
    overallGPA,
    gpaTotalCredits: gpaAccumulatedCredits,
    failedCredits,
    failedCourses,
    loading,
    addSemester,
    deleteSemester,
    addCourse,
    deleteCourse,
    updateCourse,
    importData,
    refetch: loadData,
  };
};
};

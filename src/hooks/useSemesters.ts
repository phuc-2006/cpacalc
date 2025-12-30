import { useState, useEffect, useCallback } from 'react';
import { Semester, Course, SemesterResult } from '@/types/gpa';
import { 
  calculateSemesterResults, 
  calculateCPA, 
  calculateGPAFromMainSemesters,
  generateId 
} from '@/utils/gpaCalculator';

const STORAGE_KEY = 'gpa-calculator-semesters';

export const useSemesters = () => {
  const [semesters, setSemesters] = useState<Semester[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Save to localStorage whenever semesters change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(semesters));
  }, [semesters]);

  const addSemester = useCallback((semester: Semester) => {
    setSemesters(prev => [...prev, semester]);
  }, []);

  const deleteSemester = useCallback((id: string) => {
    setSemesters(prev => prev.filter(s => s.id !== id));
  }, []);

  const addCourse = useCallback((semesterId: string, course: Omit<Course, 'id'>) => {
    setSemesters(prev => prev.map(semester => {
      if (semester.id === semesterId) {
        return {
          ...semester,
          courses: [...semester.courses, { ...course, id: generateId() }],
        };
      }
      return semester;
    }));
  }, []);

  const deleteCourse = useCallback((semesterId: string, courseId: string) => {
    setSemesters(prev => prev.map(semester => {
      if (semester.id === semesterId) {
        return {
          ...semester,
          courses: semester.courses.filter(c => c.id !== courseId),
        };
      }
      return semester;
    }));
  }, []);

  const updateCourse = useCallback((semesterId: string, courseId: string, updates: Partial<Course>) => {
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
  }, []);

  // Calculate results
  const semesterResults: SemesterResult[] = calculateSemesterResults(semesters);
  const { cpa, totalCredits: cpaTotalCredits } = calculateCPA(semesterResults);
  const { gpa: overallGPA, totalCredits: gpaTotalCredits } = calculateGPAFromMainSemesters(semesterResults);

  return {
    semesters,
    semesterResults,
    cpa,
    cpaTotalCredits,
    overallGPA,
    gpaTotalCredits,
    addSemester,
    deleteSemester,
    addCourse,
    deleteCourse,
    updateCourse,
  };
};

import { useState, useEffect, useCallback } from 'react';
import { Semester, Course, SemesterResult } from '@/types/gpa';
import { RegistrationEntry } from '@/types/curriculum';
import { 
  calculateSemesterResults, 
  calculateCPA, 
  calculateGPAFromMainSemesters,
  generateId 
} from '@/utils/gpaCalculator';

const STORAGE_KEY = 'gpa-predictor-semesters';

export const usePredictor = () => {
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

  const syncFromData = useCallback((actualSemesters: Semester[]) => {
    // Deep clone actual semesters from the home page only
    const baseSemesters = JSON.parse(JSON.stringify(actualSemesters)) as Semester[];
    setSemesters(baseSemesters);
  }, []);

  const addPlannedSemesters = useCallback((registrations: RegistrationEntry[]) => {
    const plannedMap: Record<string, Semester> = {};
    registrations.forEach(r => {
      // Find or create the semester
      if (!plannedMap[r.semesterName]) {
         plannedMap[r.semesterName] = {
             id: `planned-${generateId()}`,
             name: r.semesterName,
             type: r.semesterName.toLowerCase().includes('hè') ? 'summer' : 'main',
             courses: []
         };
      }
      plannedMap[r.semesterName].courses.push({
         id: `reg-${r.id}`,
         name: r.courseName,
         code: r.courseCode,
         credits: r.credits,
         processScore: 0,
         finalScore: 0,
         coefficientPair: '3-7' // Default
      });
    });

    const plannedSemesters = Object.values(plannedMap);
    
    setSemesters(prev => {
        const newSemesters = [...prev];
        for (const pSem of plannedSemesters) {
          const existing = newSemesters.find(s => s.name === pSem.name);
          if (existing) {
            // Merge courses, avoid duplicate codes if possible
            const existingCodes = new Set(existing.courses.map(c => c.code));
            pSem.courses.forEach(c => {
              if (!existingCodes.has(c.code)) {
                existing.courses.push(c);
              }
            });
          } else {
            newSemesters.push(pSem);
          }
        }
        return newSemesters;
    });
  }, []);

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
    syncFromData,
    addPlannedSemesters,
    addSemester,
    deleteSemester,
    addCourse,
    deleteCourse,
    updateCourse,
  };
};
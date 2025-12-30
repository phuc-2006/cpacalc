import { 
  Course, 
  CoefficientPair, 
  GradeConversion, 
  CalculatedCourse, 
  Semester, 
  SemesterResult,
  Classification 
} from '@/types/gpa';

export const getCoefficientValues = (pair: CoefficientPair): { process: number; final: number } => {
  switch (pair) {
    case '3-7':
      return { process: 0.3, final: 0.7 };
    case '4-6':
      return { process: 0.4, final: 0.6 };
    case '5-5':
      return { process: 0.5, final: 0.5 };
    default:
      return { process: 0.3, final: 0.7 };
  }
};

export const convertToLetterGrade = (score10: number): GradeConversion => {
  if (score10 >= 9.5) return { letterGrade: 'A+', gradePoint: 4.0, classification: 'Xuất sắc' };
  if (score10 >= 8.5) return { letterGrade: 'A', gradePoint: 4.0, classification: 'Xuất sắc' };
  if (score10 >= 8.0) return { letterGrade: 'B+', gradePoint: 3.5, classification: 'Giỏi' };
  if (score10 >= 7.0) return { letterGrade: 'B', gradePoint: 3.0, classification: 'Khá' };
  if (score10 >= 6.5) return { letterGrade: 'C+', gradePoint: 2.5, classification: 'Khá' };
  if (score10 >= 5.5) return { letterGrade: 'C', gradePoint: 2.0, classification: 'Trung bình' };
  if (score10 >= 5.0) return { letterGrade: 'D+', gradePoint: 1.5, classification: 'Trung bình' };
  if (score10 >= 4.0) return { letterGrade: 'D', gradePoint: 1.0, classification: 'Yếu' };
  return { letterGrade: 'F', gradePoint: 0, classification: 'Không đạt' };
};

export const calculateCourseScore = (course: Course): CalculatedCourse => {
  const { process, final } = getCoefficientValues(course.coefficientPair);
  
  // Validation
  if (course.processScore < 3) {
    return {
      ...course,
      score10: 0,
      letterGrade: 'F',
      gradePoint4: 0,
      isValid: false,
      validationError: 'Điểm quá trình phải ≥ 3',
    };
  }
  
  if (course.finalScore < 3) {
    return {
      ...course,
      score10: 0,
      letterGrade: 'F',
      gradePoint4: 0,
      isValid: false,
      validationError: 'Điểm cuối kỳ phải ≥ 3',
    };
  }

  const score10 = Math.round((course.processScore * process + course.finalScore * final) * 10) / 10;
  const conversion = convertToLetterGrade(score10);

  return {
    ...course,
    score10,
    letterGrade: conversion.letterGrade,
    gradePoint4: conversion.gradePoint,
    isValid: true,
  };
};

export const calculateSemesterGPA = (courses: CalculatedCourse[]): { gpa: number; totalCredits: number } => {
  const validCourses = courses.filter(c => c.isValid);
  
  if (validCourses.length === 0) {
    return { gpa: 0, totalCredits: 0 };
  }

  const totalCredits = validCourses.reduce((sum, c) => sum + c.credits, 0);
  const weightedSum = validCourses.reduce((sum, c) => sum + c.gradePoint4 * c.credits, 0);
  
  const gpa = Math.round((weightedSum / totalCredits) * 100) / 100;
  
  return { gpa, totalCredits };
};

export const calculateSemesterResults = (semesters: Semester[]): SemesterResult[] => {
  return semesters.map(semester => {
    const calculatedCourses = semester.courses.map(calculateCourseScore);
    const { gpa, totalCredits } = calculateSemesterGPA(calculatedCourses);
    
    return {
      semester,
      calculatedCourses,
      gpa,
      totalCredits,
    };
  });
};

export const calculateCPA = (semesterResults: SemesterResult[]): { cpa: number; totalCredits: number } => {
  const allValidCourses = semesterResults.flatMap(sr => 
    sr.calculatedCourses.filter(c => c.isValid)
  );

  if (allValidCourses.length === 0) {
    return { cpa: 0, totalCredits: 0 };
  }

  const totalCredits = allValidCourses.reduce((sum, c) => sum + c.credits, 0);
  const weightedSum = allValidCourses.reduce((sum, c) => sum + c.gradePoint4 * c.credits, 0);
  
  const cpa = Math.round((weightedSum / totalCredits) * 100) / 100;
  
  return { cpa, totalCredits };
};

export const calculateGPAFromMainSemesters = (semesterResults: SemesterResult[]): { gpa: number; totalCredits: number } => {
  const mainSemesterResults = semesterResults.filter(sr => sr.semester.type === 'main');
  
  const allValidCourses = mainSemesterResults.flatMap(sr => 
    sr.calculatedCourses.filter(c => c.isValid)
  );

  if (allValidCourses.length === 0) {
    return { gpa: 0, totalCredits: 0 };
  }

  const totalCredits = allValidCourses.reduce((sum, c) => sum + c.credits, 0);
  const weightedSum = allValidCourses.reduce((sum, c) => sum + c.gradePoint4 * c.credits, 0);
  
  const gpa = Math.round((weightedSum / totalCredits) * 100) / 100;
  
  return { gpa, totalCredits };
};

export const getClassification = (gpa: number): Classification => {
  if (gpa >= 3.6) return 'Xuất sắc';
  if (gpa >= 3.2) return 'Giỏi';
  if (gpa >= 2.5) return 'Khá';
  if (gpa >= 2.0) return 'Trung bình';
  return 'Yếu';
};

export const getClassificationColor = (classification: Classification): string => {
  switch (classification) {
    case 'Xuất sắc':
      return 'grade-excellent';
    case 'Giỏi':
      return 'grade-good';
    case 'Khá':
      return 'grade-good';
    case 'Trung bình':
      return 'grade-average';
    case 'Yếu':
      return 'grade-poor';
    default:
      return 'grade-poor';
  }
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

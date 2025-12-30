export type SemesterType = 'main' | 'summer';

export type CoefficientPair = '3-7' | '4-6' | '5-5';

export interface Course {
  id: string;
  name: string;
  code: string;
  credits: number;
  processScore: number;
  finalScore: number;
  coefficientPair: CoefficientPair;
}

export interface Semester {
  id: string;
  name: string;
  type: SemesterType;
  courses: Course[];
}

export interface GradeConversion {
  letterGrade: string;
  gradePoint: number;
  classification: string;
}

export interface CalculatedCourse extends Course {
  score10: number;
  letterGrade: string;
  gradePoint4: number;
  isValid: boolean;
  validationError?: string;
}

export interface SemesterResult {
  semester: Semester;
  calculatedCourses: CalculatedCourse[];
  gpa: number;
  totalCredits: number;
}

export type Classification = 'Xuất sắc' | 'Giỏi' | 'Khá' | 'Trung bình' | 'Yếu';

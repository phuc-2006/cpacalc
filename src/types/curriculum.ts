export interface CurriculumCourse {
  code: string;
  name: string;
  credits: number;
  semester: string;
  department: string;
}

export interface CurriculumCategory {
  id: string;
  code: string;
  name: string;
  requiredCredits: number;
  courses: CurriculumCourse[];
  isZeroCredit?: boolean; // For PE, Military, English
}

export interface Module {
  id: string;
  name: string;
  requiredCredits: number;
  courses: CurriculumCourse[];
}

export interface GraduationRequirement {
  label: string;
  required: number | string;
  achieved: number | string;
  passed: boolean;
}

export interface PlannerState {
  selectedModule: string | null;
  registeredCourses: string[]; // course codes
}

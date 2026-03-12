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
  isZeroCredit?: boolean;
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

export interface RegistrationEntry {
  id: string;
  semesterName: string;
  courseCode: string;
  courseName: string;
  credits: number;
}

export interface PlannerState {
  selectedModule: string | null;
  curriculumImported: boolean;
}

export type ClassType = 'LT' | 'BT' | 'LT+BT' | 'TN' | 'TH' | 'ĐA' | 'ĐATN' | 'KLTN' | 'KLNC' | 'TT' | 'TTTN' | 'OTHER';

export type DayOfWeek = 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface TimeSlot {
  day: DayOfWeek;
  startSlot: number;
  endSlot: number;
  weeks: number[];
  room: string;
}

export interface ClassSection {
  courseCode: string;
  courseName: string;
  classId: string;
  classType: ClassType;
  credits: number;
  meetings: TimeSlot[];
  parentClassId?: string;
  isOnline: boolean;
  note?: string;
  program: string;
  equivalentClassIds?: string[];
}

export interface CourseGroup {
  courseCode: string;
  courseName: string;
  credits: number;
  bundles: ClassSection[][];
}

export interface Constraints {
  dayOff: DayOfWeek[];
  avoidSlots: { day: DayOfWeek; slots: number[] }[];
  preferMorning: boolean;
  allowOnline: boolean;
  programs: string[];
}

export const DEFAULT_MAX_RESULTS = 50;
export const MIN_MAX_RESULTS = 1;
export const MAX_MAX_RESULTS = 500;

export interface ScoredSchedule {
  sections: ClassSection[];
  dayOffCount: number;
  gapPenalty: number;
  morningScore: number;
}

export interface ParsedTKB {
  semester: string;
  sections: ClassSection[];
  parsedAt: string;
  sourceName: string;
}

export interface SolverDiagnostics {
  conflictingPairs: { a: string; b: string }[];
  reason?: string;
}

export interface SolverResult {
  schedules: ScoredSchedule[];
  diagnostics: SolverDiagnostics;
  totalExplored: number;
  truncated: boolean;
}

export interface SolverProgress {
  explored: number;
  found: number;
}

export const DAY_LABELS: Record<DayOfWeek, string> = {
  2: 'Thứ 2',
  3: 'Thứ 3',
  4: 'Thứ 4',
  5: 'Thứ 5',
  6: 'Thứ 6',
  7: 'Thứ 7',
  8: 'Chủ nhật',
};

export const ALL_DAYS: DayOfWeek[] = [2, 3, 4, 5, 6, 7, 8];

export const MAX_SLOTS_PER_DAY = 12;

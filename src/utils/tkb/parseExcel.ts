import * as XLSX from 'xlsx';
import type { ClassSection, ClassType, DayOfWeek, ParsedTKB, TimeSlot } from '@/types/scheduler';

const HEADER_ROW_INDEX = 2;
const KNOWN_CLASS_TYPES: ClassType[] = ['LT+BT', 'LT', 'BT', 'TN', 'TH', 'ĐA', 'ĐATN', 'KLTN', 'KLNC', 'TT', 'TTTN'];

function isNullish(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  const s = String(v).trim();
  return s === '' || s.toUpperCase() === 'NULL';
}

export function parseWeeks(input: string): number[] {
  if (isNullish(input)) return [];
  const out = new Set<number>();
  const tokens = String(input).split(/[\s,;]+/).flatMap((t) => t.split('.'));
  for (const raw of tokens) {
    const t = raw.trim();
    if (!t) continue;
    const range = /^(\d+)\s*-\s*(\d+)$/.exec(t);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      const [lo, hi] = start <= end ? [start, end] : [end, start];
      for (let i = lo; i <= hi; i++) out.add(i);
      continue;
    }
    const single = Number(t);
    if (Number.isFinite(single)) out.add(single);
  }
  return [...out].sort((a, b) => a - b);
}

export function parseCredits(input: string | number): number {
  if (typeof input === 'number') return input;
  if (isNullish(input)) return 0;
  const m = /^\s*(\d+(?:\.\d+)?)/.exec(String(input));
  return m ? Number(m[1]) : 0;
}

export function parseClassType(raw: string): ClassType {
  if (isNullish(raw)) return 'OTHER';
  const s = String(raw).trim();
  for (const t of KNOWN_CLASS_TYPES) {
    if (s === t) return t;
  }
  return 'OTHER';
}

function parseDay(raw: unknown): DayOfWeek | null {
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  if (n < 2 || n > 8) return null;
  return n as DayOfWeek;
}

function parseSlot(raw: unknown): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

interface RawRow {
  courseCode: string;
  courseName: string;
  classId: string;
  parentRef: string;
  classType: ClassType;
  credits: number;
  day: DayOfWeek | null;
  startSlot: number | null;
  endSlot: number | null;
  weeks: number[];
  room: string;
  note: string;
}

function readRow(r: unknown[]): RawRow | null {
  const courseCode = String(r[4] ?? '').trim();
  const classIdRaw = r[2];
  const classId = isNullish(classIdRaw) ? '' : String(classIdRaw).trim();
  if (!courseCode || !classId) return null;
  return {
    courseCode,
    courseName: String(r[5] ?? '').trim(),
    classId,
    parentRef: isNullish(r[3]) ? '' : String(r[3]).trim(),
    classType: parseClassType(String(r[22] ?? '')),
    credits: parseCredits(r[7] as string | number),
    day: parseDay(r[10]),
    startSlot: parseSlot(r[12]),
    endSlot: parseSlot(r[13]),
    weeks: parseWeeks(String(r[15] ?? '')),
    room: isNullish(r[16]) ? '' : String(r[16]).trim(),
    note: isNullish(r[8]) ? '' : String(r[8]).trim(),
  };
}

function detectSemester(rows: unknown[][]): string {
  for (const r of rows.slice(0, 3)) {
    const cell = String((r as unknown[])[0] ?? '');
    const m = /\b(20\d{3})\b/.exec(cell);
    if (m) return m[1];
  }
  const first = rows[HEADER_ROW_INDEX + 1];
  if (first) {
    const v = (first as unknown[])[0];
    if (Number.isFinite(Number(v))) return String(v);
  }
  return '';
}

function aggregateRows(raw: RawRow[]): ClassSection[] {
  const byClassId = new Map<string, ClassSection>();
  for (const r of raw) {
    let section = byClassId.get(r.classId);
    if (!section) {
      const parentClassId = r.parentRef && r.parentRef !== r.classId ? r.parentRef : undefined;
      section = {
        courseCode: r.courseCode,
        courseName: r.courseName,
        classId: r.classId,
        classType: r.classType,
        credits: r.credits,
        meetings: [],
        parentClassId,
        isOnline: false,
        note: r.note || undefined,
      };
      byClassId.set(r.classId, section);
    }
    if (r.day !== null && r.startSlot !== null && r.endSlot !== null) {
      const slot: TimeSlot = {
        day: r.day,
        startSlot: r.startSlot,
        endSlot: Math.max(r.startSlot, r.endSlot),
        weeks: r.weeks,
        room: r.room,
      };
      section.meetings.push(slot);
    }
  }
  for (const section of byClassId.values()) {
    section.isOnline = section.meetings.length === 0 || section.meetings.every((m) => !m.room);
  }
  return [...byClassId.values()];
}

export async function parseWorkbook(file: File): Promise<ParsedTKB> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('File Excel không có sheet nào.');
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', blankrows: false });
  if (rows.length <= HEADER_ROW_INDEX + 1) throw new Error('File Excel không có dữ liệu.');

  const semester = detectSemester(rows);
  const dataRows = rows.slice(HEADER_ROW_INDEX + 1);
  const raw: RawRow[] = [];
  for (const r of dataRows) {
    const row = readRow(r);
    if (row) raw.push(row);
  }
  const sections = aggregateRows(raw);
  return {
    semester,
    sections,
    parsedAt: new Date().toISOString(),
    sourceName: file.name,
  };
}

export function parseWorkbookFromArrayBuffer(buffer: ArrayBuffer, sourceName: string): ParsedTKB {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('File Excel không có sheet nào.');
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', blankrows: false });
  const semester = detectSemester(rows);
  const dataRows = rows.slice(HEADER_ROW_INDEX + 1);
  const raw: RawRow[] = [];
  for (const r of dataRows) {
    const row = readRow(r);
    if (row) raw.push(row);
  }
  return {
    semester,
    sections: aggregateRows(raw),
    parsedAt: new Date().toISOString(),
    sourceName,
  };
}

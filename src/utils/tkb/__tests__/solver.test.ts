import { describe, expect, it } from 'vitest';
import type { ClassSection } from '@/types/scheduler';
import { buildCourseGroups, solve } from '../solver';

const baseSection = (
  courseCode: string,
  classId: string,
  day: 2 | 3 | 4 | 5 | 6 | 7 | 8,
  startSlot: number,
  endSlot: number,
  extras: Partial<ClassSection> = {},
): ClassSection => ({
  courseCode,
  courseName: courseCode,
  classId,
  classType: 'LT',
  credits: 3,
  isOnline: false,
  program: 'CT CHUẨN',
  meetings: [{ day, startSlot, endSlot, weeks: [1, 2, 3], room: 'A' }],
  ...extras,
});

describe('buildCourseGroups', () => {
  it('pairs parent + children into bundles', () => {
    const sections: ClassSection[] = [
      baseSection('IT3323', 'LT1', 2, 1, 2),
      baseSection('IT3323', 'BT1', 3, 1, 2, { parentClassId: 'LT1' }),
      baseSection('IT3323', 'BT2', 3, 3, 4, { parentClassId: 'LT1' }),
    ];
    const [group] = buildCourseGroups(sections, ['IT3323']);
    expect(group.bundles.length).toBe(2);
    expect(group.bundles.every((b) => b.length === 2)).toBe(true);
  });

  it('treats orphans (no parent) as standalone bundles', () => {
    const sections: ClassSection[] = [
      baseSection('PH1131', 'A', 2, 1, 2),
      baseSection('PH1131', 'B', 4, 1, 2),
    ];
    const [group] = buildCourseGroups(sections, ['PH1131']);
    expect(group.bundles.length).toBe(2);
    expect(group.bundles.every((b) => b.length === 1)).toBe(true);
  });
});

describe('solve', () => {
  it('returns valid combinations and avoids conflicts', () => {
    const sections: ClassSection[] = [
      baseSection('A', 'A1', 2, 1, 3),
      baseSection('A', 'A2', 3, 1, 3),
      baseSection('B', 'B1', 2, 1, 3), // conflicts with A1
      baseSection('B', 'B2', 4, 1, 3),
    ];
    const res = solve(sections, ['A', 'B']);
    expect(res.schedules.length).toBeGreaterThan(0);
    for (const s of res.schedules) {
      const ids = s.sections.map((x) => x.classId);
      expect(ids).not.toEqual(['A1', 'B1']);
    }
  });

  it('respects dayOff constraint', () => {
    const sections: ClassSection[] = [
      baseSection('A', 'A1', 2, 1, 3),
      baseSection('A', 'A2', 7, 1, 3),
      baseSection('B', 'B1', 3, 1, 3),
    ];
    const res = solve(sections, ['A', 'B'], { dayOff: [7] });
    expect(res.schedules.length).toBeGreaterThan(0);
    for (const s of res.schedules) {
      for (const sec of s.sections) {
        for (const m of sec.meetings) {
          expect(m.day).not.toBe(7);
        }
      }
    }
  });

  it('sorts by dayOffCount desc', () => {
    const sections: ClassSection[] = [
      baseSection('A', 'A1', 2, 1, 3),
      baseSection('A', 'A2', 7, 1, 3),
      baseSection('B', 'B1', 2, 5, 7),
      baseSection('B', 'B2', 3, 1, 3),
    ];
    const res = solve(sections, ['A', 'B']);
    expect(res.schedules.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < res.schedules.length; i++) {
      expect(res.schedules[i - 1].dayOffCount).toBeGreaterThanOrEqual(res.schedules[i].dayOffCount);
    }
  });

  it('filters by program whitelist', () => {
    const sections: ClassSection[] = [
      baseSection('A', 'A1', 2, 1, 3, { program: 'CT CHUẨN' }),
      baseSection('A', 'A2', 3, 1, 3, { program: 'ELITECH' }),
    ];
    const res = solve(sections, ['A'], { programs: ['CT CHUẨN'] });
    expect(res.schedules.length).toBe(1);
    expect(res.schedules[0].sections[0].classId).toBe('A1');
  });

  it('deduplicates bundles with identical time signatures', () => {
    const sections: ClassSection[] = [
      baseSection('A', 'A1', 2, 1, 3, { meetings: [{ day: 2, startSlot: 1, endSlot: 3, weeks: [1, 2, 3], room: 'R1' }] }),
      baseSection('A', 'A2', 2, 1, 3, { meetings: [{ day: 2, startSlot: 1, endSlot: 3, weeks: [1, 2, 3], room: 'R2' }] }),
      baseSection('A', 'A3', 2, 1, 3, { meetings: [{ day: 2, startSlot: 1, endSlot: 3, weeks: [1, 2, 3], room: 'R3' }] }),
    ];
    const res = solve(sections, ['A']);
    expect(res.schedules.length).toBe(1);
    expect(res.schedules[0].sections[0].equivalentClassIds).toEqual(['A1', 'A2', 'A3']);
  });

  it('respects maxResults option', () => {
    const sections: ClassSection[] = [
      baseSection('A', 'A1', 2, 1, 2),
      baseSection('A', 'A2', 3, 1, 2),
      baseSection('A', 'A3', 4, 1, 2),
      baseSection('B', 'B1', 5, 1, 2),
      baseSection('B', 'B2', 6, 1, 2),
    ];
    const res = solve(sections, ['A', 'B'], {}, { maxResults: 2 });
    expect(res.schedules.length).toBe(2);
    expect(res.truncated).toBe(true);
  });

  it('reports pairwise conflicts when no schedule exists', () => {
    const sections: ClassSection[] = [
      baseSection('A', 'A1', 2, 1, 3),
      baseSection('B', 'B1', 2, 2, 4),
    ];
    const res = solve(sections, ['A', 'B']);
    expect(res.schedules.length).toBe(0);
    expect(res.diagnostics.conflictingPairs.length).toBe(1);
    expect(res.diagnostics.conflictingPairs[0]).toEqual({ a: 'A', b: 'B' });
  });
});

import { describe, expect, it } from 'vitest';
import { indexSection, maskOverlap, sectionsConflict, weeksToMask } from '../conflict';
import type { ClassSection } from '@/types/scheduler';

const makeSection = (overrides: Partial<ClassSection> & { meetings: ClassSection['meetings'] }): ClassSection => ({
  courseCode: 'X',
  courseName: 'x',
  classId: 'a',
  classType: 'LT',
  credits: 3,
  isOnline: false,
  program: 'CT CHUẨN',
  ...overrides,
});

describe('weeksToMask', () => {
  it('encodes weeks across 32-boundary', () => {
    const mask = weeksToMask([1, 32, 33, 52]);
    expect(maskOverlap(mask, weeksToMask([1]))).toBe(true);
    expect(maskOverlap(mask, weeksToMask([33]))).toBe(true);
    expect(maskOverlap(mask, weeksToMask([20]))).toBe(false);
  });

  it('reports no overlap for disjoint sets', () => {
    expect(maskOverlap(weeksToMask([2, 3, 4]), weeksToMask([5, 6]))).toBe(false);
  });
});

describe('sectionsConflict', () => {
  const baseMeeting = { day: 2 as const, weeks: [1, 2, 3, 4], room: 'A' };

  it('detects same day, overlapping weeks, overlapping slots', () => {
    const a = indexSection(makeSection({ classId: 'a', meetings: [{ ...baseMeeting, startSlot: 1, endSlot: 3 }] }));
    const b = indexSection(makeSection({ classId: 'b', meetings: [{ ...baseMeeting, startSlot: 3, endSlot: 5 }] }));
    expect(sectionsConflict(a, b)).toBe(true);
  });

  it('does not conflict when slots are adjacent but not overlapping', () => {
    const a = indexSection(makeSection({ classId: 'a', meetings: [{ ...baseMeeting, startSlot: 1, endSlot: 3 }] }));
    const b = indexSection(makeSection({ classId: 'b', meetings: [{ ...baseMeeting, startSlot: 4, endSlot: 6 }] }));
    expect(sectionsConflict(a, b)).toBe(false);
  });

  it('does not conflict when weeks are disjoint', () => {
    const a = indexSection(
      makeSection({ classId: 'a', meetings: [{ ...baseMeeting, weeks: [1, 2], startSlot: 1, endSlot: 3 }] }),
    );
    const b = indexSection(
      makeSection({ classId: 'b', meetings: [{ ...baseMeeting, weeks: [5, 6], startSlot: 2, endSlot: 4 }] }),
    );
    expect(sectionsConflict(a, b)).toBe(false);
  });

  it('does not conflict when on different days', () => {
    const a = indexSection(makeSection({ classId: 'a', meetings: [{ ...baseMeeting, startSlot: 1, endSlot: 3 }] }));
    const b = indexSection(
      makeSection({
        classId: 'b',
        meetings: [{ ...baseMeeting, day: 3, startSlot: 1, endSlot: 3 }],
      }),
    );
    expect(sectionsConflict(a, b)).toBe(false);
  });

  it('detects conflict across multiple meetings of one section', () => {
    const a = indexSection(
      makeSection({
        classId: 'a',
        meetings: [
          { ...baseMeeting, day: 2, startSlot: 1, endSlot: 2 },
          { ...baseMeeting, day: 4, startSlot: 5, endSlot: 6 },
        ],
      }),
    );
    const b = indexSection(makeSection({ classId: 'b', meetings: [{ ...baseMeeting, day: 4, startSlot: 6, endSlot: 7 }] }));
    expect(sectionsConflict(a, b)).toBe(true);
  });
});

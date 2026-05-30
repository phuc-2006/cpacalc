import type { ClassSection, TimeSlot } from '@/types/scheduler';

export type WeekMask = [number, number];

export function weeksToMask(weeks: number[]): WeekMask {
  let lo = 0;
  let hi = 0;
  for (const w of weeks) {
    if (w < 1 || w > 52) continue;
    if (w <= 32) lo |= 1 << (w - 1);
    else hi |= 1 << (w - 33);
  }
  return [lo >>> 0, hi >>> 0];
}

export function maskOverlap(a: WeekMask, b: WeekMask): boolean {
  return (a[0] & b[0]) !== 0 || (a[1] & b[1]) !== 0;
}

export function slotOverlap(a: TimeSlot, b: TimeSlot): boolean {
  return !(a.endSlot < b.startSlot || b.endSlot < a.startSlot);
}

export interface MaskedSlot {
  day: TimeSlot['day'];
  startSlot: number;
  endSlot: number;
  mask: WeekMask;
}

export interface IndexedSection {
  section: ClassSection;
  slots: MaskedSlot[];
}

export function indexSection(section: ClassSection): IndexedSection {
  return {
    section,
    slots: section.meetings.map((m) => ({
      day: m.day,
      startSlot: m.startSlot,
      endSlot: m.endSlot,
      mask: weeksToMask(m.weeks.length ? m.weeks : Array.from({ length: 19 }, (_, i) => i + 1)),
    })),
  };
}

export function slotsConflict(a: MaskedSlot, b: MaskedSlot): boolean {
  if (a.day !== b.day) return false;
  if (!maskOverlap(a.mask, b.mask)) return false;
  return !(a.endSlot < b.startSlot || b.endSlot < a.startSlot);
}

export function sectionsConflict(a: IndexedSection, b: IndexedSection): boolean {
  for (const sa of a.slots) {
    for (const sb of b.slots) {
      if (slotsConflict(sa, sb)) return true;
    }
  }
  return false;
}

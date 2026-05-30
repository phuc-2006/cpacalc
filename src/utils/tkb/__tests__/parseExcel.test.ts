import { describe, expect, it } from 'vitest';
import { parseClassType, parseCredits, parseWeeks } from '../parseExcel';

describe('parseWeeks', () => {
  it('expands simple range', () => {
    expect(parseWeeks('2-9')).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('handles range plus comma list', () => {
    expect(parseWeeks('2-9,11-19')).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
  });

  it('handles comma-separated singletons', () => {
    expect(parseWeeks('11,12,13')).toEqual([11, 12, 13]);
  });

  it('handles dot-separated singletons', () => {
    expect(parseWeeks('11.12')).toEqual([11, 12]);
  });

  it('returns empty for NULL string', () => {
    expect(parseWeeks('NULL')).toEqual([]);
    expect(parseWeeks('')).toEqual([]);
  });

  it('deduplicates and sorts', () => {
    expect(parseWeeks('5,3,5,4')).toEqual([3, 4, 5]);
  });
});

describe('parseCredits', () => {
  it('reads credits from HUST khối_lượng format', () => {
    expect(parseCredits('2(2-1-0-4)')).toBe(2);
    expect(parseCredits('3(3-1-0-6)')).toBe(3);
  });

  it('handles bare number', () => {
    expect(parseCredits(4)).toBe(4);
    expect(parseCredits('4')).toBe(4);
  });

  it('returns 0 for invalid', () => {
    expect(parseCredits('NULL')).toBe(0);
    expect(parseCredits('')).toBe(0);
  });
});

describe('parseClassType', () => {
  it('preserves known types', () => {
    expect(parseClassType('LT')).toBe('LT');
    expect(parseClassType('BT')).toBe('BT');
    expect(parseClassType('LT+BT')).toBe('LT+BT');
    expect(parseClassType('TN')).toBe('TN');
    expect(parseClassType('ĐATN')).toBe('ĐATN');
  });

  it('falls back to OTHER for unknown', () => {
    expect(parseClassType('XYZ')).toBe('OTHER');
    expect(parseClassType('')).toBe('OTHER');
  });
});

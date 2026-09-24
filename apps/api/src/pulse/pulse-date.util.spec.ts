import { daysAgoDateString } from './pulse-date.util';

describe('daysAgoDateString', () => {
  it('bugünü YYYY-MM-DD döner', () => {
    expect(daysAgoDateString(0, new Date(2026, 8, 24, 13, 0))).toBe(
      '2026-09-24',
    );
  });

  it('ay ve yıl sınırını geçer', () => {
    expect(daysAgoDateString(24, new Date(2026, 8, 24))).toBe('2026-08-31');
    expect(daysAgoDateString(1, new Date(2026, 0, 1))).toBe('2025-12-31');
  });
});

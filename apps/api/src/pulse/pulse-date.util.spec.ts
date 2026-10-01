import { daysAgoDateString } from './pulse-date.util';

// Girdiler UTC anı olarak veriliyor ki test makinenin saat diliminden
// bağımsız olsun. İstanbul = UTC+3.
describe('daysAgoDateString', () => {
  it('bugünü YYYY-MM-DD döner', () => {
    expect(
      daysAgoDateString(0, new Date(Date.UTC(2026, 8, 24, 10, 0))),
    ).toBe('2026-09-24');
  });

  it('günü İstanbul saatine göre değiştirir, UTC gece yarısına göre değil', () => {
    // UTC 21:30 = İstanbul 00:30, yani ertesi gün
    expect(
      daysAgoDateString(0, new Date(Date.UTC(2026, 8, 24, 21, 30))),
    ).toBe('2026-09-25');
    // UTC 20:59 = İstanbul 23:59, hâlâ aynı gün
    expect(
      daysAgoDateString(0, new Date(Date.UTC(2026, 8, 24, 20, 59))),
    ).toBe('2026-09-24');
  });

  it('ay ve yıl sınırını geçer', () => {
    expect(
      daysAgoDateString(24, new Date(Date.UTC(2026, 8, 24, 12))),
    ).toBe('2026-08-31');
    expect(
      daysAgoDateString(1, new Date(Date.UTC(2026, 0, 1, 12))),
    ).toBe('2025-12-31');
  });
});

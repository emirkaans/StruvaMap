import { bucketByDay } from './bucket-by-day';

describe('bucketByDay', () => {
  it('boş dizi için boş sonuç döner', () => {
    expect(bucketByDay([])).toEqual([]);
  });

  it("aynı gündeki satırları tek bucket'ta toplar", () => {
    const rows = [
      { created_at: '2026-01-01T08:00:00Z' },
      { created_at: '2026-01-01T20:00:00Z' },
      { created_at: '2026-01-01T23:59:59Z' },
    ];
    expect(bucketByDay(rows)).toEqual([{ date: '2026-01-01', count: 3 }]);
  });

  it('farklı günleri tarihe göre artan sırada döner', () => {
    const rows = [
      { created_at: '2026-01-03T00:00:00Z' },
      { created_at: '2026-01-01T00:00:00Z' },
      { created_at: '2026-01-02T00:00:00Z' },
    ];
    expect(bucketByDay(rows)).toEqual([
      { date: '2026-01-01', count: 1 },
      { date: '2026-01-02', count: 1 },
      { date: '2026-01-03', count: 1 },
    ]);
  });

  it('giriş sırası karışık olsa da tutarlı sonuç verir', () => {
    const rows = [
      { created_at: '2026-02-15T10:00:00Z' },
      { created_at: '2026-02-14T10:00:00Z' },
      { created_at: '2026-02-15T11:00:00Z' },
      { created_at: '2026-02-14T12:00:00Z' },
    ];
    expect(bucketByDay(rows)).toEqual([
      { date: '2026-02-14', count: 2 },
      { date: '2026-02-15', count: 2 },
    ]);
  });
});

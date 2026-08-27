export interface DailyCount {
  date: string;
  count: number;
}

/* events/results/comparisons "günlük toplam" trend uçlarının ortak bucketing
   mantığı — created_at'ı YYYY-MM-DD'ye indirger ve gün başına sayar. */
export function bucketByDay(rows: { created_at: string }[]): DailyCount[] {
  const buckets = new Map<string, number>();
  for (const row of rows) {
    const date = row.created_at.slice(0, 10);
    buckets.set(date, (buckets.get(date) ?? 0) + 1);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

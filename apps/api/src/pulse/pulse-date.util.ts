// v1: tek sabit sunucu saat dilimi (process TZ) — kullanıcı bazlı timezone
// Faz 2 stretch (bkz. plan). "YYYY-MM-DD" formatı hem checkin_date (date
// kolonu) hem de packages/shared pickPulseQuestion ile uyumlu.
export function todayDateString(): string {
  return daysAgoDateString(0);
}

// Takvim günü aritmetiği yerel saatle yapılıyor (setDate), yaz saati geçişinde
// 24 saat çıkarmanın bir günü atlaması/tekrarlaması riski olmasın diye.
export function daysAgoDateString(
  days: number,
  now: Date = new Date(),
): string {
  const date = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - days,
  );
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

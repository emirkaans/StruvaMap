// v1: tek sabit sunucu saat dilimi (process TZ) — kullanıcı bazlı timezone
// Faz 2 stretch (bkz. plan). "YYYY-MM-DD" formatı hem checkin_date (date
// kolonu) hem de packages/shared pickPulseQuestion ile uyumlu.
export function todayDateString(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

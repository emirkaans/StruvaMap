// v1: tüm kullanıcılar için tek sabit saat dilimi — kullanıcı bazlı timezone
// Faz 2 stretch (bkz. plan). Process TZ'ye güvenilmiyor: Render'da process
// UTC'de çalışır, o zaman gün 03:00'te dönerdi. "YYYY-MM-DD" formatı hem
// checkin_date (date kolonu) hem de packages/shared pickPulseQuestion ile uyumlu.
export const APP_TIME_ZONE = 'Europe/Istanbul';

const dateParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function todayDateString(): string {
  return daysAgoDateString(0);
}

// Önce `now`ın İstanbul'daki takvim günü bulunur, gün aritmetiği sonra UTC
// üzerinde yapılır (Date.UTC saat dilimi/yaz saati kaymasından etkilenmez).
export function daysAgoDateString(
  days: number,
  now: Date = new Date(),
): string {
  const parts = dateParts.formatToParts(now);
  const part = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);
  const date = new Date(
    Date.UTC(part('year'), part('month') - 1, part('day') - days),
  );
  return date.toISOString().slice(0, 10);
}

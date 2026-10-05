export function toTurkishUpper(s: string): string {
  return s.replace(/i/g, "İ").replace(/ı/g, "I").toUpperCase();
}

// "6 boyut · 32 soru · ~7 dakika" → "7"; bulunamazsa "?".
export function minutesFromSubtitle(subtitle: string): string {
  const m = subtitle.match(/~?(\d+)\s*dakika/);
  return m ? m[1] : "?";
}

// CSS text-transform:uppercase tarayıcılarda Türkçe kurallarını izlemez:
// "i" harfini noktasız "I" yapar (doğrusu noktalı "İ"). Eyebrow etiketleri
// gibi büyük harfe çevrilen metinlerde bu fonksiyonu kullan.
export function toTurkishUpper(s: string): string {
  return s.replace(/i/g, "İ").replace(/ı/g, "I").toUpperCase();
}

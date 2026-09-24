// Emek defteri: nabız eşleşmesindeki iki kişi günlük işleri tek dokunuşla
// kaydeder; haftalık dağılım "Emek" endeksinin algısını gerçek kayıtlarla
// yan yana koyar. Bu bir SAYIM'dır — işlerin süresi ve ağırlığı farklıdır,
// arayüz bunu açıkça söyler.

export interface LabourCategory {
  id: string;
  label: string;
}

export const LABOUR_CATEGORIES: LabourCategory[] = [
  { id: "cooking", label: "Yemek" },
  { id: "cleaning", label: "Temizlik" },
  { id: "laundry", label: "Çamaşır" },
  { id: "shopping", label: "Alışveriş" },
  { id: "bills", label: "Faturalar ve ödemeler" },
  { id: "planning", label: "Planlama ve hatırlama" },
  { id: "care", label: "Bakım (çocuk, yaşlı, evcil)" },
  { id: "emotional", label: "Duygusal destek" },
  { id: "other", label: "Diğer" },
];

export function isLabourCategory(id: string): boolean {
  return LABOUR_CATEGORIES.some((c) => c.id === id);
}

export interface LabourEntryForSummary {
  category: string;
  mine: boolean;
}

export interface LabourCategoryCount {
  id: string;
  label: string;
  mine: number;
  partner: number;
}

export interface LabourWeekSummary {
  mine: number;
  partner: number;
  // Kayıtların yüzde kaçı senden (0-100); hiç kayıt yoksa null.
  myShare: number | null;
  // Tüm kategoriler, LABOUR_CATEGORIES sırasıyla (sıfır olanlar dahil).
  categories: LabourCategoryCount[];
}

export function summarizeLabourWeek(entries: LabourEntryForSummary[]): LabourWeekSummary {
  const categories = LABOUR_CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    mine: entries.filter((e) => e.category === c.id && e.mine).length,
    partner: entries.filter((e) => e.category === c.id && !e.mine).length,
  }));
  const mine = categories.reduce((sum, c) => sum + c.mine, 0);
  const partner = categories.reduce((sum, c) => sum + c.partner, 0);
  const total = mine + partner;
  return { mine, partner, myShare: total === 0 ? null : Math.round((mine / total) * 100), categories };
}

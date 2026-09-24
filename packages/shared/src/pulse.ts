export interface PulseQuestion {
  id: string;
  testId: string;
  text: string;
}

// Faz 1: yalnızca romantic dolu (içerik kararı, kod test_id'ye göre generic
// çalışıyor — yeni bir tür eklemek TEST_REGISTRY'deki desenle aynı, yalnızca
// bu kayda bir dizi eklemek yeterli).
export const PULSE_QUESTIONS: Record<string, PulseQuestion[]> = {
  romantic: [
    { id: "romantic-1", testId: "romantic", text: "Bugün emek dengesi nasıldı?" },
    { id: "romantic-2", testId: "romantic", text: "Bugün kararları birlikte mi aldınız?" },
    { id: "romantic-3", testId: "romantic", text: "Bugün kendine ayıracak alanın oldu mu?" },
    { id: "romantic-4", testId: "romantic", text: "Bugün duyulduğunu hissettin mi?" },
    { id: "romantic-5", testId: "romantic", text: "Bugün küçük bir jest fark ettin mi?" },
    { id: "romantic-6", testId: "romantic", text: "Bugün bir konuda gerginlik oldu mu?" },
  ],
};

export function findPulseQuestionById(testId: string, id: string): PulseQuestion | null {
  return PULSE_QUESTIONS[testId]?.find((q) => q.id === id) ?? null;
}

// Gün-of-year % soru sayısı: rastgelelik yok, aynı gün tekrar çağrılırsa
// (cron retry, lazy-create fallback) hep aynı soruyu üretir.
export function pickPulseQuestion(testId: string, date: Date): PulseQuestion | null {
  const questions = PULSE_QUESTIONS[testId];
  if (!questions || questions.length === 0) return null;

  const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 1);
  const dayOfYear = Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - startOfYear) / 86400000);
  return questions[dayOfYear % questions.length];
}

// Nabız geçmişinde bir gün: kullanıcının kendi bakış açısından (my/partner),
// sunucu pulse_checkins satırını A/B'den buna çevirir (bkz. pulse.service.ts).
export interface PulseHistoryEntry {
  date: string; // "YYYY-MM-DD"
  questionKey: string;
  myAnswer: number | null;
  partnerAnswer: number | null;
}

export interface PulseWeekSummary {
  answeredDays: number; // kullanıcının cevapladığı gün sayısı
  bothAnsweredDays: number;
  myAverage: number | null; // 1 ondalık
  partnerAverage: number | null;
  // İkinizin de cevapladığı ve cevaplar arasında PULSE_GAP_THRESHOLD ve
  // üstü fark olan günler — kıyaslamadaki "algı farkı"nın günlük karşılığı.
  gapDays: number;
  // İkinizin de cevapladığı günler içinde ortalaması en düşük olan soru —
  // haftanın "konuşmaya değer" noktası. Eşitlikte en yeni gün seçilir.
  lowest: { date: string; questionText: string; average: number } | null;
}

// 1-5 ölçeğinde 2 puan: "orta" ile "zayıf/güçlü" arasındaki fark. Eşik,
// test eşikleri (55/75) gibi tasarım kararıdır, ampirik değildir.
export const PULSE_GAP_THRESHOLD = 2;

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

// Deterministik: aynı girdi hep aynı özeti üretir, AI yok. Hangi günlerin
// "hafta"ya dahil olduğunu çağıran seçer (bkz. PulseService.getHistory).
export function summarizePulseWeek(testId: string, entries: PulseHistoryEntry[]): PulseWeekSummary {
  const mine = entries.flatMap((e) => (e.myAnswer != null ? [e.myAnswer] : []));
  const partner = entries.flatMap((e) => (e.partnerAnswer != null ? [e.partnerAnswer] : []));
  const both = entries.filter((e) => e.myAnswer != null && e.partnerAnswer != null);

  let lowest: PulseWeekSummary["lowest"] = null;
  for (const e of [...both].sort((a, b) => b.date.localeCompare(a.date))) {
    const avg = ((e.myAnswer as number) + (e.partnerAnswer as number)) / 2;
    if (lowest == null || avg < lowest.average) {
      const question = findPulseQuestionById(testId, e.questionKey);
      lowest = { date: e.date, questionText: question?.text ?? "Bugün nasıl geçti?", average: avg };
    }
  }

  return {
    answeredDays: mine.length,
    bothAnsweredDays: both.length,
    myAverage: average(mine),
    partnerAverage: average(partner),
    gapDays: both.filter((e) => Math.abs((e.myAnswer as number) - (e.partnerAnswer as number)) >= PULSE_GAP_THRESHOLD).length,
    lowest,
  };
}

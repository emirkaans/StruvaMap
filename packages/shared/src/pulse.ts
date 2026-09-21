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

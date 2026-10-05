import type { Answers } from "@struva/shared";

/* Yarım kalan testin bu cihazda saklanması: sayfa yenilenir ya da kapanırsa
   kaldığı yerden devam edilebilsin. Soru sırası da saklanır, yoksa karışık
   sıra her açılışta değişir ve "12. soru" başka bir soruya denk gelir. */

export interface SavedProgress {
  order: number[]; // gösterilen soru sırası (question.id)
  answers: Answers;
  contextAnswers: Record<string, string>;
  ci: number;
  i: number;
  savedAt: number;
}

// Bir haftadan eski yarım test unutulmuş sayılır.
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function key(testId: string, compareWith: string | null): string {
  return `struva_progress_${testId}${compareWith ? `_${compareWith}` : ""}`;
}

export function loadProgress(
  testId: string,
  compareWith: string | null,
  questionIds: number[],
): SavedProgress | null {
  try {
    const raw = localStorage.getItem(key(testId, compareWith));
    if (!raw) return null;
    const saved = JSON.parse(raw) as SavedProgress;
    const sameQuestions =
      Array.isArray(saved.order) &&
      saved.order.length === questionIds.length &&
      saved.order.every((id) => questionIds.includes(id));
    if (!sameQuestions || Date.now() - saved.savedAt > MAX_AGE_MS) {
      clearProgress(testId, compareWith);
      return null;
    }
    return saved;
  } catch {
    return null;
  }
}

export function saveProgress(testId: string, compareWith: string | null, progress: SavedProgress): void {
  try {
    localStorage.setItem(key(testId, compareWith), JSON.stringify(progress));
  } catch {
    // depolama kapalı ya da dolu: test yine çalışır, yalnızca kaldığı yer hatırlanmaz
  }
}

export function clearProgress(testId: string, compareWith: string | null): void {
  try {
    localStorage.removeItem(key(testId, compareWith));
  } catch {
    // yok sayılır
  }
}

// Kaydedilmiş ilerlemede cevaplanmış soru sayısı (giriş ekranındaki "12 / 32").
export function answeredCount(progress: SavedProgress): number {
  return Object.keys(progress.answers).length;
}

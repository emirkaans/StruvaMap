// StruvaMap — Deterministik puanlama motoru
//
// MVP'deki js/scoring.js ile birebir aynı mantık; tek fark test-agnostik
// olması (dimensions/indices artık TestDefinition'dan gelir).
//
// AI hiçbir zaman skoru hesaplamaz. Skorlama tamamen buradaki deterministik
// kurallarla yapılır; AI (ileride) yalnızca bu çıktıyı okunabilir metne çevirir.

import type {
  Answers,
  Band,
  ContextAnswers,
  DimensionInterpretation,
  ScoreResult,
  ScoringThresholds,
  TestDefinition,
} from "./types.js";

export const DEFAULT_THRESHOLDS: ScoringThresholds = {
  tensionThreshold: 55,
  strengthThreshold: 75,
};

export function computeScores(
  test: TestDefinition,
  answers: Answers,
  thresholds: ScoringThresholds = DEFAULT_THRESHOLDS,
  contextAnswers?: ContextAnswers,
): ScoreResult {
  const dimIds = Object.keys(test.dimensions);

  // 1) Boyut bazında soru puanlarını topla
  const buckets: Record<string, number[]> = {};
  for (const dimId of dimIds) buckets[dimId] = [];

  // satisfactionQuestion işaretli sorular ayrı bir bucket'a da düşer; bu,
  // dimensions/indices/rsi hesabını etkilemez (aynı soru her iki bucket'a girer).
  const satisfactionBuckets: Record<string, number[]> = {};

  for (const q of test.questions) {
    const chosen = answers[q.id];
    if (chosen == null) continue; // cevaplanmamış soruyu atla
    const score = q.options[chosen]?.score;
    if (score == null) continue;
    buckets[q.dim].push(score);
    if (q.satisfactionQuestion) {
      (satisfactionBuckets[q.dim] ??= []).push(score);
    }
  }

  const satisfaction: Record<string, number> = {};
  for (const dimId of Object.keys(satisfactionBuckets)) {
    const arr = satisfactionBuckets[dimId];
    if (arr.length) satisfaction[dimId] = Math.round(mean(arr));
  }

  // 2) Boyut skoru = o boyuttaki soru puanlarının ortalaması
  const dimensions: Record<string, number> = {};
  for (const dimId of dimIds) {
    const arr = buckets[dimId];
    dimensions[dimId] = arr.length ? Math.round(mean(arr)) : 0;
  }

  // 3) Üst-endeksler = ilgili boyutların ortalaması (eşit ağırlık)
  const byIndex: Record<string, number[]> = {};
  for (const dimId of dimIds) {
    const indexId = test.dimensions[dimId].index;
    (byIndex[indexId] ??= []).push(dimensions[dimId]);
  }
  const indices: Record<string, number> = {};
  for (const indexId of Object.keys(test.indices)) {
    indices[indexId] = Math.round(mean(byIndex[indexId] ?? []));
  }

  // 4) RSI = tüm boyutların ortalaması (eşit ağırlık)
  const rsi = Math.round(mean(Object.values(dimensions)));

  // 5) Güçlü / gerilimli alanlar
  const ranked = [...dimIds].sort((a, b) => dimensions[b] - dimensions[a]);
  const strengths = ranked
    .filter((d) => dimensions[d] >= thresholds.strengthThreshold)
    .slice(0, 3);
  const tensions = [...ranked]
    .reverse()
    .filter((d) => dimensions[d] < thresholds.tensionThreshold)
    .slice(0, 3);

  // 6) Deterministik yorum metinleri (her boyutun kendi tanımından gelir)
  const interpretation: DimensionInterpretation[] = dimIds.map((dimId) => {
    const score = dimensions[dimId];
    const band = bandOf(score);
    const dim = test.dimensions[dimId];
    let text = dim.interpretation[band];
    if (contextAnswers && dim.conditionalNotes) {
      for (const cn of dim.conditionalNotes) {
        if (cn.band === band && contextAnswers[cn.contextQuestionId] === cn.whenValue) {
          text += ` ${cn.note}`;
        }
      }
    }
    return { dim: dimId, name: dim.name, score, band, text };
  });

  const result: ScoreResult = { testId: test.id, rsi, dimensions, indices, strengths, tensions, interpretation };
  if (Object.keys(satisfaction).length) result.satisfaction = satisfaction;
  return result;
}

function mean(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function bandOf(score: number): Band {
  if (score >= 75) return "yüksek";
  if (score >= 55) return "orta";
  return "düşük";
}

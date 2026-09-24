// Tahmin modu: davet eden kişi, karşı taraf testi bitirmeden önce onun her
// boyutta nerede duracağını tahmin eder. Kıyaslama çıkınca tahmin gerçek
// skorlarla karşılaştırılır — "farklı mıyız?" sorusunun yanına "bunun
// farkında mıyım?" sorusunu ekler. Tamamen deterministik, AI yok.

// Web ComparisonPage / Android ComparisonScreen'deki algı farkı eşiğiyle aynı.
export const PERCEPTION_GAP_THRESHOLD = 20;

// Tahmin gerçek skora bu kadar yakınsa "isabetli" sayılır. Tasarım kararı
// (0-100 ölçeğinde yarım bant), ampirik değil.
export const PREDICTION_TOLERANCE = 15;

export type PredictionInsightKind =
  // Benzer algılıyorsunuz ve bunu biliyordun.
  | "aligned_known"
  // Farklı algılıyorsunuz ve bunun farkındaydın.
  | "different_known"
  // Farklı algılıyorsunuz ama bunu öngörmedin — en çok konuşmaya değer olan.
  | "different_missed"
  // Aslında benzer algılıyorsunuz ama farklı sanıyordun.
  | "aligned_missed";

export interface DimensionPredictionInsight {
  dim: string;
  own: number; // tahmin edenin kendi skoru
  predicted: number; // karşı taraf için tahmini
  actual: number; // karşı tarafın gerçek skoru
  error: number; // |predicted - actual|
  kind: PredictionInsightKind;
}

export interface PredictionSummary {
  accuracy: number; // 0-100: 100 - ortalama mutlak hata
  insights: DimensionPredictionInsight[];
}

export function classifyPrediction(own: number, predicted: number, actual: number): PredictionInsightKind {
  const different = Math.abs(own - actual) >= PERCEPTION_GAP_THRESHOLD;
  const known = Math.abs(predicted - actual) <= PREDICTION_TOLERANCE;
  if (different) return known ? "different_known" : "different_missed";
  return known ? "aligned_known" : "aligned_missed";
}

// Yalnızca üç haritada da bulunan boyutlar değerlendirilir; sıra
// `own`'daki (test tanımındaki) sıradır. Ortak boyut yoksa null.
export function evaluatePrediction(
  own: Record<string, number>,
  predicted: Record<string, number>,
  actual: Record<string, number>,
): PredictionSummary | null {
  const insights = Object.keys(own)
    .filter((dim) => predicted[dim] != null && actual[dim] != null)
    .map((dim) => {
      const error = Math.abs(predicted[dim] - actual[dim]);
      return {
        dim,
        own: own[dim],
        predicted: predicted[dim],
        actual: actual[dim],
        error,
        kind: classifyPrediction(own[dim], predicted[dim], actual[dim]),
      };
    });
  if (insights.length === 0) return null;

  const meanError = insights.reduce((sum, i) => sum + i.error, 0) / insights.length;
  return { accuracy: Math.max(0, Math.round(100 - meanError)), insights };
}

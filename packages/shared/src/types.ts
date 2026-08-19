// StruvaMap — paylaşılan tipler
// Bu paket test-agnostiktir: romantik, iş, aile, arkadaşlık testlerinin hepsi
// aynı Question/Dimension/ScoreResult şeklini kullanır. Her test kendi
// TestDefinition'ını tanımlar; scoring motoru bu tanıma göre çalışır.

export type QuestionType = "likert" | "likert_reverse" | "balance";

export interface Option {
  label: string;
  score: number; // 0-100
}

export interface Question {
  id: number;
  dim: string;
  type: QuestionType;
  text: string;
  options: Option[];
  // true ise bu soru boyutun ana ortalamasına ek olarak ayrı bir "memnuniyet"
  // göstergesine de katkı sağlar (bkz. ScoreResult.satisfaction). Ana boyut
  // skorunu değiştirmez — sadece paralel, ayrı gösterilen bir sinyaldir.
  satisfactionQuestion?: boolean;
  // Soru metni role göre gerçekçi değilse (ör. bir ebeveynin çocuğunun
  // eşyasını karıştırması ile çocuğun ebeveynin eşyasını karıştırması aynı
  // olasılıkta değil), contextQuestions'taki "role" cevabına göre alternatif
  // metin. Puanlama ve options aynı kalır, sadece görünen cümle değişir.
  textByRole?: Record<string, string>;
}

// Cevaplayanın rolü/bağlamı gibi puanlamaya girmeyen meta sorular. Sadece
// yorum metni seçiminde kullanılır (bkz. Dimension.conditionalNotes).
export interface ContextQuestionOption {
  label: string;
  value: string;
}

export interface ContextQuestion {
  id: string;
  text: string;
  options: ContextQuestionOption[];
}

// contextQuestions cevapları: contextQuestion.id -> seçilen option.value
export type ContextAnswers = Record<string, string>;

export type Band = "yüksek" | "orta" | "düşük";

export interface Dimension {
  id: string;
  name: string;
  short: string;
  index: string; // hangi üst-endekse ait
  // Bandına göre deterministik yorum metni.
  interpretation: Record<Band, string>;
  // Belirli bir context cevabı verildiğinde, ilgili banda ek olarak eklenen
  // koşullu not (ör. "çocuk 18 altıysa düşük karar payı yaşa uygun olabilir").
  // Ana yorum metnini değiştirmez, sonuna eklenir.
  conditionalNotes?: ConditionalNote[];
}

export interface ConditionalNote {
  contextQuestionId: string;
  whenValue: string;
  band: Band;
  note: string;
}

export interface IndexDef {
  id: string;
  name: string;
  desc: string;
}

export interface TestDefinition {
  id: string; // ör. "romantic", "work", "family", "friendship"
  slug: string;
  name: string;
  subtitle: string;
  inviteCta: string; // ör. "Partnerini davet et", "Arkadaşını davet et"
  dimensions: Record<string, Dimension>;
  indices: Record<string, IndexDef>;
  questions: Question[];
  // Cevaplayanın rolü/yaşı gibi puanlamaya girmeyen meta sorular (opsiyonel).
  contextQuestions?: ContextQuestion[];
  // "Teşhis değil" uyarısına eklenen, teste özgü ek not (ör. meşru hiyerarşik
  // asimetri uyarısı). Romantik/arkadaşlık testlerinde kullanılmaz.
  disclaimerNote?: string;
}

// answers: questionId -> seçilen option index
export type Answers = Record<number, number>;

export interface DimensionInterpretation {
  dim: string;
  name: string;
  score: number;
  band: Band;
  text: string;
}

export interface ScoreResult {
  testId: string;
  rsi: number; // 0-100
  dimensions: Record<string, number>;
  indices: Record<string, number>;
  strengths: string[];
  tensions: string[];
  interpretation: DimensionInterpretation[];
  // satisfactionQuestion işaretli sorulardan hesaplanan, dimensions/indices/rsi'ye
  // karışmayan ayrı memnuniyet göstergesi. Sadece bu tür soruya sahip ve
  // cevaplanmış boyutlar için anahtar içerir.
  satisfaction?: Record<string, number>;
}

export interface ScoringThresholds {
  tensionThreshold: number;
  strengthThreshold: number;
}

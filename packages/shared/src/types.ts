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
}

export type Band = "yüksek" | "orta" | "düşük";

export interface Dimension {
  id: string;
  name: string;
  short: string;
  index: string; // hangi üst-endekse ait
  // Bandına göre deterministik yorum metni.
  interpretation: Record<Band, string>;
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
}

export interface ScoringThresholds {
  tensionThreshold: number;
  strengthThreshold: number;
}

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
  satisfactionQuestion?: boolean;
  textByRole?: Record<string, string>;
}

export interface ContextQuestionOption {
  label: string;
  value: string;
}

export interface ContextQuestion {
  id: string;
  text: string;
  options: ContextQuestionOption[];
}

export type ContextAnswers = Record<string, string>;

export type Band = "yüksek" | "orta" | "düşük";

export interface Dimension {
  id: string;
  name: string;
  short: string;
  index: string; // hangi üst-endekse ait
  interpretation: Record<Band, string>;
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
  contextQuestions?: ContextQuestion[];
  disclaimerNote?: string;
}

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
  satisfaction?: Record<string, number>;
}

export interface ScoringThresholds {
  tensionThreshold: number;
  strengthThreshold: number;
}

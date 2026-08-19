import type { Option, QuestionType } from "./types.js";

export const LIKERT: Option[] = [
  { label: "Kesinlikle katılıyorum", score: 100 },
  { label: "Katılıyorum", score: 75 },
  { label: "Kararsızım", score: 50 },
  { label: "Katılmıyorum", score: 25 },
  { label: "Kesinlikle katılmıyorum", score: 0 },
];

export const LIKERT_REVERSE: Option[] = [
  { label: "Kesinlikle katılıyorum", score: 0 },
  { label: "Katılıyorum", score: 25 },
  { label: "Kararsızım", score: 50 },
  { label: "Katılmıyorum", score: 75 },
  { label: "Kesinlikle katılmıyorum", score: 100 },
];

export const BALANCE: Option[] = [
  { label: "Neredeyse her zaman ben", score: 0 },
  { label: "Çoğunlukla ben", score: 50 },
  { label: "Yaklaşık eşit", score: 100 },
  { label: "Çoğunlukla partnerim", score: 50 },
  { label: "Neredeyse her zaman partnerim", score: 0 },
];

export const OPTION_SETS: Record<QuestionType, Option[]> = {
  likert: LIKERT,
  likert_reverse: LIKERT_REVERSE,
  balance: BALANCE,
};

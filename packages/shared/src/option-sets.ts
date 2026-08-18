// Ortak seçenek setleri — tüm testler bu üç tipten birini kullanır.
//   likert         -> Katılım = yüksek sağlık  (5=100 ... 1=0)
//   likert_reverse -> Katılım = düşük sağlık   (5=0   ... 1=100)
//   balance        -> Denge = yüksek sağlık    (eşit=100, uçlar=0)

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

// "balance" tipinde önemli olan işin kimde olduğu değil, ne kadar dengesiz
// olduğudur — bu yüzden iki uç da düşük puan alır, "yaklaşık eşit" en yüksek.
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

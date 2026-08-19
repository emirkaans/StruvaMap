import type { Dimension, IndexDef, Question, QuestionType, TestDefinition } from "../types.js";
import { OPTION_SETS } from "../option-sets.js";

const dimensions: Record<string, Dimension> = {
  decision: {
    id: "decision",
    name: "Karar Paylaşımı",
    short: "Kararlar nasıl ve kimin lehine alınıyor?",
    index: "power",
    interpretation: {
      yüksek: "Kararlar büyük ölçüde karşılıklı ve paylaşımlı alınıyor; taraflardan birinin sistematik üstünlüğü görünmüyor.",
      orta: "Kararlar çoğu zaman paylaşılıyor, ancak bazı alanlarda taraflardan biri daha belirleyici olabiliyor.",
      düşük: "Kararların belirgin biçimde bir tarafta yoğunlaştığı görülüyor. Bu bir 'karar asimetrisi' işaretidir.",
    },
  },
  domestic: {
    id: "domestic",
    name: "Ev İçi Emek",
    short: "Fiziksel ev işlerinin dağılımı.",
    index: "labour",
    interpretation: {
      yüksek: "Fiziksel ev işleri görece dengeli paylaşılıyor.",
      orta: "Ev işlerinde ölçülü bir dengesizlik var; bazı görevler bir tarafta yoğunlaşıyor olabilir.",
      düşük: "Fiziksel ev işleri belirgin biçimde bir tarafta toplanmış görünüyor.",
    },
  },
  mental: {
    id: "mental",
    name: "Zihinsel Yük",
    short: "Planlama ve hatırlama emeğinin dağılımı.",
    index: "labour",
    interpretation: {
      yüksek: "Planlama ve hatırlama gibi görünmeyen zihinsel yük dengeli dağılmış.",
      orta: "Zihinsel yükte kısmi bir dengesizlik var; koordinasyon işleri kısmen bir tarafta.",
      düşük: "Planlama ve koordinasyon (mental load) büyük ölçüde bir tarafın üzerinde yoğunlaşıyor. Ev işleri eşit görünse bile toplam emek eşit olmayabilir.",
    },
  },
  digital: {
    id: "digital",
    name: "Dijital Emek",
    short: "Araştırma, rezervasyon, koordinasyon emeği.",
    index: "labour",
    interpretation: {
      yüksek: "Araştırma, rezervasyon ve dijital koordinasyon emeği dengeli paylaşılıyor.",
      orta: "Dijital koordinasyon emeğinde kısmi bir dengesizlik görünüyor.",
      düşük: "Dijital koordinasyon emeği (araştırma, rezervasyon, mesajlaşma) belirgin biçimde bir tarafta.",
    },
  },
  social: {
    id: "social",
    name: "Sosyal Özerklik",
    short: "Bireysel sosyal alanın korunması.",
    index: "autonomy",
    interpretation: {
      yüksek: "Bireysel sosyal alan güçlü biçimde korunuyor; ilişki bireyselliği kısıtlamıyor.",
      orta: "Bireysel sosyal alan çoğunlukla korunuyor, ancak bazı durumlarda daralabiliyor.",
      düşük: "Bireysel sosyal alanın daraldığı görülüyor. Bu düşük algılanan özerklik işaretidir.",
    },
  },
  family: {
    id: "family",
    name: "Aile Sınırları",
    short: "Ailelerin ilişki üzerindeki etkisi ve sınırlar.",
    index: "autonomy",
    interpretation: {
      yüksek: "Ailelerle ilişkide dengeli ve sağlıklı sınırlar kurulmuş görünüyor.",
      orta: "Aile sınırları çoğunlukla dengeli, ancak bazı konularda bir aile daha etkili olabiliyor.",
      düşük: "Ailelerin ilişki üzerindeki etkisi yüksek ya da dengesiz görünüyor.",
    },
  },
};

const indices: Record<string, IndexDef> = {
  power: { id: "power", name: "Güç", desc: "Karar ve etki dengesi." },
  labour: { id: "labour", name: "Emek", desc: "Ev işi, zihinsel ve dijital emeğin dağılımı." },
  autonomy: { id: "autonomy", name: "Özerklik", desc: "Bireysel sosyal alan ve aile sınırları." },
};

const RAW_QUESTIONS: { dim: string; type: QuestionType; text: string; satisfactionQuestion?: boolean }[] = [
  { dim: "decision", type: "likert", text: "Önemli kararlarımızda her iki tarafın görüşü yaklaşık eşit ağırlıktadır." },
  { dim: "decision", type: "likert_reverse", text: "Bir konuda anlaşamadığımızda genellikle aynı kişi son sözü söyler." },
  { dim: "decision", type: "likert_reverse", text: "Partnerimin ihtiyaçları benimkilerden daha sık öncelik kazanır." },
  { dim: "decision", type: "balance", text: "Tatil, taşınma gibi büyük kararları çoğunlukla kim verir?" },
  { dim: "decision", type: "balance", text: "Büyük harcamalarla ilgili son kararı genellikle kim verir?" },

  { dim: "domestic", type: "balance", text: "Yemek hazırlama işini genellikle kim yapar?" },
  { dim: "domestic", type: "balance", text: "Ev temizliğini çoğunlukla kim yapar?" },
  { dim: "domestic", type: "balance", text: "Çamaşır ve ütü işlerini çoğunlukla kim yapar?" },
  { dim: "domestic", type: "balance", text: "Günlük market alışverişini genellikle kim yapar?" },
  { dim: "domestic", type: "likert", text: "Ev işlerinin aramızdaki dağılımını adil buluyorum.", satisfactionQuestion: true },

  { dim: "mental", type: "balance", text: "Evde nelerin eksildiğini / ihtiyaç olduğunu çoğunlukla kim fark eder?" },
  { dim: "mental", type: "balance", text: "Faturaların ödenmesini ve takibini çoğunlukla kim üstlenir?" },
  { dim: "mental", type: "balance", text: "Randevu, doğum günü gibi tarihleri çoğunlukla kim hatırlar?" },
  { dim: "mental", type: "balance", text: "Yapılması gereken işleri çoğunlukla kim planlar ve organize eder?" },
  { dim: "mental", type: "likert_reverse", text: "Evle ilgili aklımda tutmam gereken çok fazla şey olduğunu hissederim." },
  { dim: "mental", type: "likert", text: "Zihinsel yükün (planlama, hatırlama, koordinasyon) aramızdaki dağılımından memnunum.", satisfactionQuestion: true },

  { dim: "digital", type: "balance", text: "Restoran, tatil veya etkinlik araştırmalarını çoğunlukla kim yapar?" },
  { dim: "digital", type: "balance", text: "Online alışveriş ve rezervasyonları çoğunlukla kim yönetir?" },
  { dim: "digital", type: "balance", text: "Ortak sosyal hayatımızla ilgili mesajlaşmaları çoğunlukla kim yürütür?" },
  { dim: "digital", type: "balance", text: "Fotoğrafları saklama ve paylaşma işini çoğunlukla kim yapar?" },
  { dim: "digital", type: "balance", text: "Ortak takvim ve planları dijital olarak çoğunlukla kim takip eder?" },
  { dim: "digital", type: "likert", text: "Dijital koordinasyon emeğinin (araştırma, rezervasyon, mesajlaşma) dağılımından memnunum.", satisfactionQuestion: true },

  { dim: "social", type: "likert", text: "Partnerim olmadan arkadaşlarımla vakit geçirmekte kendimi özgür hissederim." },
  { dim: "social", type: "likert_reverse", text: "İlişkim başladıktan sonra yakın arkadaşlarımla görüşme sıklığım belirgin biçimde azaldı." },
  { dim: "social", type: "likert", text: "Ayrı hobilerimizin olması ilişkimizde sorun yaratmaz." },
  { dim: "social", type: "likert_reverse", text: "Partnerimden bağımsız bir plan yaptığımda suçluluk hissederim." },
  { dim: "social", type: "likert", text: "Partnerim sosyal ilişkilerimi kontrol etmeye çalışmaz." },

  { dim: "family", type: "likert_reverse", text: "Önemli kararlarımızda ailelerimizin görüşü belirleyici olur." },
  { dim: "family", type: "likert", text: "Hangi aileyi ne sıklıkta ziyaret edeceğimiz konusunda dengeli bir düzenimiz var." },
  { dim: "family", type: "balance", text: "Ailelerin ilişkimiz üzerindeki etkisi kimin tarafında daha ağır basar?" },
  { dim: "family", type: "likert_reverse", text: "Aile ziyaretlerinde taraflardan biri diğerinden belirgin şekilde baskın." },
  { dim: "family", type: "likert", text: "Ailelerimizle ilişkimizde sağlıklı sınırlar koyabiliyoruz." },
];

const questions: Question[] = RAW_QUESTIONS.map((q, i) => ({
  id: i,
  dim: q.dim,
  type: q.type,
  text: q.text,
  options: OPTION_SETS[q.type],
  satisfactionQuestion: q.satisfactionQuestion,
}));

export const romanticTest: TestDefinition = {
  id: "romantic",
  slug: "romantik-iliski-testi",
  name: "İlişki Yapısı Anlık Görünümü",
  subtitle: "6 boyut · 32 soru · ~7 dakika",
  inviteCta: "Partnerini davet et",
  dimensions,
  indices,
  questions,
};

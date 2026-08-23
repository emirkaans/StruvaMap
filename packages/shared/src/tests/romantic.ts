import type { Dimension, IndexDef, Question, QuestionType, TestDefinition } from "../types.js";
import { OPTION_SETS } from "../option-sets.js";

const dimensions: Record<string, Dimension> = {
  decision: {
    id: "decision",
    name: "Karar Paylaşımı",
    short: "Kararlar nasıl ve kimin lehine alınıyor?",
    index: "power",
    interpretation: {
      yüksek: "Önemli kararları çoğunlukla birlikte alıyorsunuz; sürekli aynı kişi son sözü söylemiyor.",
      orta: "Kararların çoğunu birlikte alıyorsunuz ama bazı konularda bir taraf daha çok belirleyici oluyor.",
      düşük: "Kararlar büyük ölçüde tek bir kişide toplanmış görünüyor.",
    },
  },
  domestic: {
    id: "domestic",
    name: "Ev İçi Emek",
    short: "Fiziksel ev işlerinin dağılımı.",
    index: "labour",
    interpretation: {
      yüksek: "Ev işlerini aşağı yukarı dengeli paylaşıyorsunuz.",
      orta: "Ev işlerinde ölçülü bir dengesizlik var; bazı işler hep aynı kişiye kalıyor olabilir.",
      düşük: "Ev işlerinin çoğunu tek bir kişi yapıyor gibi görünüyor.",
    },
  },
  mental: {
    id: "mental",
    name: "Zihinsel Yük",
    short: "Planlama ve hatırlama emeğinin dağılımı.",
    index: "labour",
    interpretation: {
      yüksek: "Neyin ne zaman yapılması gerektiğini hatırlama, planlama gibi görünmeyen işler de dengeli dağılmış.",
      orta: "Planlama ve hatırlama işlerinde kısmi bir dengesizlik var; bu işler biraz daha çok bir kişiye kalıyor.",
      düşük: "Planlama ve hatırlama işi büyük ölçüde tek bir kişinin üstünde. Ev işleri eşit görünse bile, kafada taşınan yük eşit olmayabilir.",
    },
  },
  digital: {
    id: "digital",
    name: "Dijital Emek",
    short: "Araştırma, rezervasyon, koordinasyon emeği.",
    index: "labour",
    interpretation: {
      yüksek: "Araştırma yapma, rezervasyon ayarlama gibi işleri dengeli paylaşıyorsunuz.",
      orta: "Bu tür işlerde kısmi bir dengesizlik görünüyor.",
      düşük: "Araştırma, rezervasyon, mesajlaşma gibi işlerin çoğunu tek bir kişi yapıyor.",
    },
  },
  social: {
    id: "social",
    name: "Sosyal Özerklik",
    short: "Bireysel sosyal alanın korunması.",
    index: "autonomy",
    interpretation: {
      yüksek: "Kendi arkadaşlıklarınıza ve zamanınıza saygı duyuluyor; ilişki bireyselliğinizi kısıtlamıyor.",
      orta: "Kişisel alanınız çoğunlukla korunuyor, ama bazen daralabiliyor.",
      düşük: "Kişisel alanınızın belirgin şekilde daraldığı görülüyor.",
    },
  },
  family: {
    id: "family",
    name: "Aile Sınırları",
    short: "Ailelerin ilişki üzerindeki etkisi ve sınırlar.",
    index: "autonomy",
    interpretation: {
      yüksek: "Ailelerinizle ilişkinizde dengeli ve sağlıklı sınırlar var.",
      orta: "Aile sınırları çoğunlukla dengeli, ama bazı konularda bir taraf ailesi daha etkili olabiliyor.",
      düşük: "Bir tarafın ailesi ilişki üzerinde oldukça baskın ya da dengesiz bir etkiye sahip görünüyor.",
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

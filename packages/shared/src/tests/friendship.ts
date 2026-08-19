// StruvaMap — Arkadaşlık İlişkisi Testi
// 6 boyut, 31 soru (effort'ta bir memnuniyet sorusu fazladan), 3 üst-endekse
// gruplu: reciprocity | support | trust
//
// effort/practical'daki memnuniyet sorularının (satisfactionQuestion) amacı:
// dengesiz dağılım rızaya dayalıysa bunu ayrıca görünür kılmak (bkz.
// ScoreResult.satisfaction). Bu sorular boyut ortalamasını değiştirmez.
// Arkadaşlık akran ilişkisi olduğu için (aksine work.ts/family.ts'teki
// hiyerarşik ilişkilerin) contextQuestions mekanizması burada kullanılmaz.

import type { Dimension, IndexDef, Option, Question, QuestionType, TestDefinition } from "../types.js";
import { OPTION_SETS } from "../option-sets.js";

// "balance" sorularında ortak option-sets.ts "partnerim" ifadesini kullanıyor
// (romantik testten birebir taşındı); arkadaşlık bağlamında "arkadaşım" gerekli.
const FRIEND_BALANCE: Option[] = [
  { label: "Neredeyse her zaman ben", score: 0 },
  { label: "Çoğunlukla ben", score: 50 },
  { label: "Yaklaşık eşit", score: 100 },
  { label: "Çoğunlukla arkadaşım", score: 50 },
  { label: "Neredeyse her zaman arkadaşım", score: 0 },
];

const dimensions: Record<string, Dimension> = {
  initiative: {
    id: "initiative",
    name: "İletişim Girişimi",
    short: "Görüşme ve iletişimi kim başlatıyor?",
    index: "reciprocity",
    interpretation: {
      yüksek: "İletişimi başlatma sorumluluğu iki taraf arasında dengeli dağılmış; taraflardan birinin sürekli inisiyatif alması gerekmiyor.",
      orta: "İletişim girişiminde kısmi bir dengesizlik var; bazı dönemlerde bir taraf daha çok inisiyatif alıyor olabilir.",
      düşük: "İletişimi başlatma büyük ölçüde bir tarafta yoğunlaşmış görünüyor. Bu bir 'girişim asimetrisi' işaretidir.",
    },
  },
  effort: {
    id: "effort",
    name: "Emek Dengesi",
    short: "Zaman ve çaba yatırımının dağılımı.",
    index: "reciprocity",
    interpretation: {
      yüksek: "Zaman ve çaba yatırımı iki taraf arasında dengeli.",
      orta: "Emek dengesinde ölçülü bir dengesizlik var; bir taraf bazen daha fazla çaba gösteriyor olabilir.",
      düşük: "Bu arkadaşlığa yatırılan çaba belirgin biçimde bir tarafta toplanmış görünüyor.",
    },
  },
  emotional: {
    id: "emotional",
    name: "Duygusal Destek",
    short: "Zor zamanlarda dinlenme ve anlaşılma.",
    index: "support",
    interpretation: {
      yüksek: "Duygusal destek karşılıklı ve güvenli biçimde alışverişte.",
      orta: "Duygusal destekte kısmi bir dengesizlik var; bazı durumlarda destek tek yönlü kalabiliyor.",
      düşük: "Duygusal destek belirgin biçimde tek yönlü görünüyor; bu, yük hissi ya da yalnızlaşma riski taşıyabilir.",
    },
  },
  practical: {
    id: "practical",
    name: "Pratik Destek",
    short: "Yardım isteme/verme ve kaynak paylaşımı.",
    index: "support",
    interpretation: {
      yüksek: "Pratik yardım ve kaynak paylaşımı dengeli biçimde iki yönlü işliyor.",
      orta: "Pratik destekte kısmi bir dengesizlik var; yardım isteme/verme bazen tek yönlü olabiliyor.",
      düşük: "Pratik destek belirgin biçimde bir taraftan diğerine akıyor görünüyor.",
    },
  },
  honesty: {
    id: "honesty",
    name: "Dürüstlük ve Çatışma",
    short: "Açık iletişim, kırgınlık ve özür dengesi.",
    index: "trust",
    interpretation: {
      yüksek: "Çatışma ve kırgınlıklar açıkça konuşulabiliyor; güven güçlü görünüyor.",
      orta: "Dürüstlük ve çatışma yönetiminde kısmi bir zorlanma var; bazı konular konuşulmadan geçiştirilebiliyor.",
      düşük: "Kırgınlıkların konuşulmadığı ya da özür/geri adımın hep aynı taraftan geldiği görülüyor. Bu, biriken gerilim işareti olabilir.",
    },
  },
  autonomy: {
    id: "autonomy",
    name: "Özerklik",
    short: "Bağımsız hayata ve diğer ilişkilere saygı.",
    index: "trust",
    interpretation: {
      yüksek: "Bağımsız hayatlara ve başka ilişkilere saygı güçlü; arkadaşlık kişisel alanı kısıtlamıyor.",
      orta: "Özerklik çoğunlukla korunuyor, ancak bazı durumlarda sahiplenme ya da tedirginlik görülebiliyor.",
      düşük: "Bağımsız kararlara ya da diğer ilişkilere karşı belirgin bir tedirginlik/sahiplenme görülüyor. Bu düşük algılanan özerklik işaretidir.",
    },
  },
};

const indices: Record<string, IndexDef> = {
  reciprocity: { id: "reciprocity", name: "Karşılıklılık", desc: "Girişim ve emek dengesi." },
  support: { id: "support", name: "Destek", desc: "Duygusal ve pratik destek alışverişi." },
  trust: { id: "trust", name: "Güven ve Sınırlar", desc: "Dürüstlük, çatışma yönetimi ve özerklik." },
};

const RAW_QUESTIONS: { dim: string; type: QuestionType; text: string; satisfactionQuestion?: boolean }[] = [
  // --- İletişim Girişimi (reciprocity) ---
  { dim: "initiative", type: "balance", text: "Buluşma/görüşme teklifini genellikle kim yapar?" },
  { dim: "initiative", type: "balance", text: "Mesajlaşmayı genellikle kim başlatır?" },
  { dim: "initiative", type: "likert", text: "Aramızdaki iletişimin başlatılma sorumluluğunu dengeli buluyorum." },
  { dim: "initiative", type: "likert_reverse", text: "Ben aramazsam/yazmazsam uzun süre haber alamayacağımızı hissederim." },
  { dim: "initiative", type: "balance", text: "Plan yapma ve organizasyonu genellikle kim üstlenir?" },

  // --- Emek Dengesi (reciprocity) ---
  { dim: "effort", type: "likert", text: "İkimiz de bu arkadaşlık için benzer düzeyde zaman ayırıyoruz." },
  { dim: "effort", type: "likert_reverse", text: "Bu arkadaşlığa kattığım çabanın karşılığından daha fazla olduğunu hissediyorum." },
  { dim: "effort", type: "balance", text: "Buluşma yeri/zamanı gibi pratik detayları genellikle kim ayarlar?" },
  { dim: "effort", type: "balance", text: "Uzak kaldığımız dönemlerde iletişimi canlı tutmak için çoğunlukla kim çaba gösterir?" },
  { dim: "effort", type: "likert", text: "Zor bir dönemimde bile bu arkadaşlığa yatırım yapmaya değer görürüm ve karşılığını alırım." },
  { dim: "effort", type: "likert", text: "Bu arkadaşlığa harcanan çabanın dağılımından memnunum, dengesiz olsa bile bu bana sorun yaratmıyor.", satisfactionQuestion: true },

  // --- Duygusal Destek (support) ---
  { dim: "emotional", type: "likert", text: "Zor bir şey yaşadığımda arkadaşıma açılabileceğimi hissederim." },
  { dim: "emotional", type: "likert", text: "Arkadaşım beni yargılamadan dinler." },
  { dim: "emotional", type: "likert_reverse", text: "Duygusal olarak zorlandığımda arkadaşıma yük olmaktan çekinirim." },
  { dim: "emotional", type: "balance", text: "İkimizden biri moralsizken, destek olma çabası genellikle kimden gelir?" },
  { dim: "emotional", type: "likert", text: "Arkadaşım sevindiğimde de zorlandığımda da yanımda oluyor." },

  // --- Pratik Destek (support) ---
  { dim: "practical", type: "balance", text: "Pratik bir yardıma ihtiyaç olduğunda (taşınma, iş, tavsiye) genellikle kim kimden yardım ister?" },
  { dim: "practical", type: "likert", text: "Bir şeye ihtiyacım olduğunda arkadaşımdan yardım istemekte tereddüt etmem." },
  { dim: "practical", type: "likert_reverse", text: "Arkadaşımın benden istediği yardımların benim istediklerimden daha sık olduğunu hissediyorum." },
  { dim: "practical", type: "likert", text: "Aramızda kaynak (bilgi, bağlantı, eşya, zaman) paylaşımı dengelidir.", satisfactionQuestion: true },
  { dim: "practical", type: "balance", text: "Kriz anında (acil durum, taşınma, hastalık) ilk aranan taraf genellikle hangimiz oluyor?" },

  // --- Dürüstlük ve Çatışma (trust) ---
  { dim: "honesty", type: "likert", text: "Aramızda bir sorun olduğunda bunu açıkça konuşabiliriz." },
  { dim: "honesty", type: "likert_reverse", text: "Kırgınlıklarımı arkadaşıma söylemek yerine içimde tutarım." },
  { dim: "honesty", type: "likert", text: "Fikir ayrılığında birbirimizin görüşüne saygı duyarız." },
  { dim: "honesty", type: "likert_reverse", text: "Bu arkadaşlıkta genellikle aynı kişi özür diler ya da geri adım atar." },
  { dim: "honesty", type: "likert", text: "Arkadaşımın bana karşı dürüst olduğuna güvenirim." },

  // --- Özerklik (trust) ---
  { dim: "autonomy", type: "likert", text: "Arkadaşımın başka arkadaşlıkları/ilişkileri olması beni rahatsız etmez." },
  { dim: "autonomy", type: "likert_reverse", text: "Arkadaşım başka biriyle vakit geçirdiğinde kendimi dışlanmış hissederim." },
  { dim: "autonomy", type: "likert", text: "Ayrı zevklerimiz/çevrelerimiz olması arkadaşlığımıza zarar vermez." },
  { dim: "autonomy", type: "likert_reverse", text: "Arkadaşımdan onay almadan karar aldığımda tedirgin olurum." },
  { dim: "autonomy", type: "likert", text: "Arkadaşım benim bağımsız kararlarıma saygı duyar." },
];

const questions: Question[] = RAW_QUESTIONS.map((q, i) => ({
  id: i,
  dim: q.dim,
  type: q.type,
  text: q.text,
  options: q.type === "balance" ? FRIEND_BALANCE : OPTION_SETS[q.type],
  satisfactionQuestion: q.satisfactionQuestion,
}));

export const friendshipTest: TestDefinition = {
  id: "friendship",
  slug: "arkadaslik-iliskisi-testi",
  name: "Arkadaşlık Yapısı Anlık Görünümü",
  subtitle: "6 boyut · 31 soru · ~7 dakika",
  inviteCta: "Arkadaşını davet et",
  dimensions,
  indices,
  questions,
};

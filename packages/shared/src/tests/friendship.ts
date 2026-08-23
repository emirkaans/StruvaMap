import type { Dimension, IndexDef, Option, Question, QuestionType, TestDefinition } from "../types.js";
import { OPTION_SETS } from "../option-sets.js";

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
      yüksek: "Mesaj atmayı ya da aramayı ikiniz de aşağı yukarı eşit başlatıyorsunuz. Sürekli aynı kişi ilk adımı atmak zorunda kalmıyor.",
      orta: "Bazen bir tarafın diğerinden biraz daha çok ilk adımı attığı oluyor, ama bu çok belirgin değil.",
      düşük: "Neredeyse hep aynı kişi mesaj atıyor ya da arıyor. O kişi aramasa, uzun süre haber alamayabilirsiniz.",
    },
  },
  effort: {
    id: "effort",
    name: "Emek Dengesi",
    short: "Zaman ve çaba yatırımının dağılımı.",
    index: "reciprocity",
    interpretation: {
      yüksek: "Bu arkadaşlığa ikiniz de aşağı yukarı aynı kadar zaman ve emek harcıyorsunuz.",
      orta: "Bazen bir taraf diğerinden biraz daha fazla emek harcıyor olabilir, ama fark küçük.",
      düşük: "Bu arkadaşlık için emeğin çoğunu tek bir kişi harcıyor gibi görünüyor.",
    },
  },
  emotional: {
    id: "emotional",
    name: "Duygusal Destek",
    short: "Zor zamanlarda dinlenme ve anlaşılma.",
    index: "support",
    interpretation: {
      yüksek: "Zor zamanlarda birbirinize destek oluyorsunuz, bu karşılıklı işliyor.",
      orta: "Çoğunlukla birbirinize destek oluyorsunuz ama bazen destek sadece tek taraftan geliyor.",
      düşük: "Duygusal destek çoğunlukla tek taraftan diğerine akıyor. Bu, destek veren kişiyi yorabilir, destek alamayan kişiyi de yalnız hissettirebilir.",
    },
  },
  practical: {
    id: "practical",
    name: "Pratik Destek",
    short: "Yardım isteme/verme ve kaynak paylaşımı.",
    index: "support",
    interpretation: {
      yüksek: "Yardım isteme ve yardım etme ikiniz arasında dengeli işliyor.",
      orta: "Bazen yardım hep aynı yönde gidiyor — biri hep isteyen, diğeri hep veren taraf oluyor.",
      düşük: "Pratik yardım (eşya, bilgi, zaman) neredeyse hep aynı kişiden diğerine gidiyor.",
    },
  },
  honesty: {
    id: "honesty",
    name: "Dürüstlük ve Çatışma",
    short: "Açık iletişim, kırgınlık ve özür dengesi.",
    index: "trust",
    interpretation: {
      yüksek: "Kırgınlıkları ve anlaşmazlıkları rahatça konuşabiliyorsunuz; birbirinize güveniyorsunuz.",
      orta: "Bazı konuları konuşmak yerine üstünü örtüp geçiyor olabilirsiniz.",
      düşük: "Kırgınlıklar genelde konuşulmuyor, ya da özür dileyen hep aynı kişi oluyor. Bu, zamanla birikip büyüyebilecek bir gerginliğe işaret eder.",
    },
  },
  autonomy: {
    id: "autonomy",
    name: "Özerklik",
    short: "Bağımsız hayata ve diğer ilişkilere saygı.",
    index: "trust",
    interpretation: {
      yüksek: "Birbirinizin başka arkadaşlıklarına ve kendi hayatına saygı duyuyorsunuz; bu arkadaşlık kişisel alanınızı kısıtlamıyor.",
      orta: "Genelde birbirinizin alanına saygı duyuyorsunuz ama bazen kıskançlık ya da tedirginlik oluyor.",
      düşük: "Diğer kişinin kendi kararlarına ya da başka arkadaşlıklarına karşı belirgin bir kıskançlık/sahiplenme var. Bu, kişisel alanın daraldığını gösterir.",
    },
  },
};

const indices: Record<string, IndexDef> = {
  reciprocity: { id: "reciprocity", name: "Karşılıklılık", desc: "Girişim ve emek dengesi." },
  support: { id: "support", name: "Destek", desc: "Duygusal ve pratik destek alışverişi." },
  trust: { id: "trust", name: "Güven ve Sınırlar", desc: "Dürüstlük, çatışma yönetimi ve özerklik." },
};

const RAW_QUESTIONS: { dim: string; type: QuestionType; text: string; satisfactionQuestion?: boolean }[] = [
  { dim: "initiative", type: "balance", text: "Buluşma/görüşme teklifini genellikle kim yapar?" },
  { dim: "initiative", type: "balance", text: "Mesajlaşmayı genellikle kim başlatır?" },
  { dim: "initiative", type: "likert", text: "Aramızdaki iletişimin başlatılma sorumluluğunu dengeli buluyorum." },
  { dim: "initiative", type: "likert_reverse", text: "Ben aramazsam/yazmazsam uzun süre haber alamayacağımızı hissederim." },
  { dim: "initiative", type: "balance", text: "Plan yapma ve organizasyonu genellikle kim üstlenir?" },

  { dim: "effort", type: "likert", text: "İkimiz de bu arkadaşlık için benzer düzeyde zaman ayırıyoruz." },
  { dim: "effort", type: "likert_reverse", text: "Bu arkadaşlığa kattığım çabanın karşılığından daha fazla olduğunu hissediyorum." },
  { dim: "effort", type: "balance", text: "Buluşma yeri/zamanı gibi pratik detayları genellikle kim ayarlar?" },
  { dim: "effort", type: "balance", text: "Uzak kaldığımız dönemlerde iletişimi canlı tutmak için çoğunlukla kim çaba gösterir?" },
  { dim: "effort", type: "likert", text: "Zor bir dönemimde bile bu arkadaşlığa yatırım yapmaya değer görürüm ve karşılığını alırım." },
  { dim: "effort", type: "likert", text: "Bu arkadaşlığa harcanan çabanın dağılımından memnunum, dengesiz olsa bile bu bana sorun yaratmıyor.", satisfactionQuestion: true },

  { dim: "emotional", type: "likert", text: "Zor bir şey yaşadığımda arkadaşıma açılabileceğimi hissederim." },
  { dim: "emotional", type: "likert", text: "Arkadaşım beni yargılamadan dinler." },
  { dim: "emotional", type: "likert_reverse", text: "Duygusal olarak zorlandığımda arkadaşıma yük olmaktan çekinirim." },
  { dim: "emotional", type: "balance", text: "İkimizden biri moralsizken, destek olma çabası genellikle kimden gelir?" },
  { dim: "emotional", type: "likert", text: "Arkadaşım sevindiğimde de zorlandığımda da yanımda oluyor." },

  { dim: "practical", type: "balance", text: "Pratik bir yardıma ihtiyaç olduğunda (taşınma, iş, tavsiye) genellikle kim kimden yardım ister?" },
  { dim: "practical", type: "likert", text: "Bir şeye ihtiyacım olduğunda arkadaşımdan yardım istemekte tereddüt etmem." },
  { dim: "practical", type: "likert_reverse", text: "Arkadaşımın benden istediği yardımların benim istediklerimden daha sık olduğunu hissediyorum." },
  { dim: "practical", type: "likert", text: "Aramızda kaynak (bilgi, bağlantı, eşya, zaman) paylaşımı dengelidir.", satisfactionQuestion: true },
  { dim: "practical", type: "balance", text: "Kriz anında (acil durum, taşınma, hastalık) ilk aranan taraf genellikle hangimiz oluyor?" },

  { dim: "honesty", type: "likert", text: "Aramızda bir sorun olduğunda bunu açıkça konuşabiliriz." },
  { dim: "honesty", type: "likert_reverse", text: "Kırgınlıklarımı arkadaşıma söylemek yerine içimde tutarım." },
  { dim: "honesty", type: "likert", text: "Fikir ayrılığında birbirimizin görüşüne saygı duyarız." },
  { dim: "honesty", type: "likert_reverse", text: "Bu arkadaşlıkta genellikle aynı kişi özür diler ya da geri adım atar." },
  { dim: "honesty", type: "likert", text: "Arkadaşımın bana karşı dürüst olduğuna güvenirim." },

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

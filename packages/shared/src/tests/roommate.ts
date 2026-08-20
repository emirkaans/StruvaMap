import type {
  Dimension,
  IndexDef,
  Option,
  Question,
  QuestionType,
  TestDefinition,
} from "../types.js";
import { OPTION_SETS } from "../option-sets.js";

const ROOMMATE_BALANCE: Option[] = [
  { label: "Neredeyse her zaman ben", score: 0 },
  { label: "Çoğunlukla ben", score: 50 },
  { label: "Yaklaşık eşit", score: 100 },
  { label: "Çoğunlukla ev arkadaşım", score: 50 },
  { label: "Neredeyse her zaman ev arkadaşım", score: 0 },
];

const dimensions: Record<string, Dimension> = {
  chores: {
    id: "chores",
    name: "Ev İşi Dağılımı",
    short: "Temizlik, çöp, bulaşık gibi günlük işler nasıl paylaşılıyor?",
    index: "labour",
    interpretation: {
      yüksek:
        "Ev işleri dengeli paylaşılıyor; günlük yük tek tarafta yığılmıyor.",
      orta: "Ev işlerinin dağılımında ölçülü bir dengesizlik var; bazı işler bir tarafta daha çok toplanabiliyor.",
      düşük:
        "Günlük ev işlerinin belirgin biçimde bir tarafta yoğunlaştığı görülüyor. Bu bir 'iş yükü asimetrisi' işaretidir.",
    },
  },
  expenses: {
    id: "expenses",
    name: "Ortak Masraf Dengesi",
    short: "Kira, fatura, market gibi ortak giderler adil paylaşılıyor mu?",
    index: "labour",
    interpretation: {
      yüksek: "Ortak masraflar adil ve düzenli biçimde paylaşılıyor.",
      orta: "Masraf paylaşımında kısmi bir dengesizlik var; takip ya da hatırlatma bazen tek tarafa kalabiliyor.",
      düşük:
        "Ortak masrafların takibi ve karşılanması belirgin biçimde bir tarafta toplanmış görünüyor.",
    },
  },
  standards: {
    id: "standards",
    name: "Düzen ve Temizlik Uyumu",
    short: "Temizlik ve düzen beklentileri birbirine ne kadar yakın?",
    index: "harmony",
    interpretation: {
      yüksek:
        "Temizlik ve düzen beklentileri büyük ölçüde örtüşüyor; ortak bir orta yol bulunabiliyor.",
      orta: "Beklentilerde kısmi bir uyumsuzluk var; bazı konularda taraflardan biri diğerine uyum sağlamak zorunda kalıyor.",
      düşük:
        "Temizlik/düzen standartları belirgin biçimde uyuşmuyor; uyum sağlama yükü tek tarafta görünüyor.",
    },
  },
  communication: {
    id: "communication",
    name: "İletişim ve Çatışma Çözümü",
    short: "Ev ile ilgili sorunlar ve anlaşmazlıklar nasıl konuşuluyor?",
    index: "harmony",
    interpretation: {
      yüksek:
        "Ev ile ilgili sorunlar doğrudan ve açıkça konuşulabiliyor; gerginlikler birikmiyor.",
      orta: "İletişim çoğunlukla açık, ancak bazı rahatsızlıklar dile getirilmeden içte kalabiliyor.",
      düşük:
        "Rahatsızlıkların konuşulmadığı ya da görmezden gelindiği bir örüntü görülüyor. Bu, biriken gerilim işareti olabilir.",
    },
  },
  guests: {
    id: "guests",
    name: "Misafir ve Ortak Alan",
    short: "Misafir ağırlama ve ortak alan kullanımı nasıl belirleniyor?",
    index: "boundaries",
    interpretation: {
      yüksek:
        "Misafir ve ortak alan kullanımında karşılıklı gözetilen, netleşmiş bir anlayış var.",
      orta: "Ortak alan kullanımı çoğunlukla gözetiliyor, ancak zaman zaman gerginlik yaratabiliyor.",
      düşük:
        "Misafir ağırlama ya da ortak alan kullanımı belirgin bir rahatsızlık ya da tek taraflı belirlenme kaynağı görünüyor.",
    },
  },
  privacy: {
    id: "privacy",
    name: "Sessizlik ve Kişisel Alan",
    short: "Gürültü, mahremiyet ve kişisel eşyalara saygı nasıl?",
    index: "boundaries",
    interpretation: {
      yüksek:
        "Kişisel alan, eşyalar ve sessizlik ihtiyacı büyük ölçüde gözetiliyor.",
      orta: "Kişisel alana saygı çoğunlukla var, ancak zaman zaman ihlal edilebiliyor.",
      düşük:
        "Kişisel alana, mahremiyete ya da sessizlik ihtiyacına belirgin bir taşma görülüyor.",
    },
  },
};

const indices: Record<string, IndexDef> = {
  labour: {
    id: "labour",
    name: "Emek",
    desc: "Ev işleri ve ortak masrafların dağılımı.",
  },
  harmony: {
    id: "harmony",
    name: "Uyum",
    desc: "Düzen standartları ve iletişim/çatışma çözümü.",
  },
  boundaries: {
    id: "boundaries",
    name: "Sınırlar",
    desc: "Misafir, ortak alan ve kişisel alan dengesi.",
  },
};

const RAW_QUESTIONS: {
  dim: string;
  type: QuestionType;
  text: string;
  satisfactionQuestion?: boolean;
}[] = [
  {
    dim: "chores",
    type: "likert",
    text: "Ev işleri (temizlik, çöp, bulaşık) aramızda adil paylaşılıyor.",
  },
  {
    dim: "chores",
    type: "likert_reverse",
    text: "Ev işlerinin çoğunu ben üstleniyorum, karşılığını göremiyorum.",
  },
  {
    dim: "chores",
    type: "balance",
    text: "Ortak alanların (mutfak, banyo, salon) temizliğini genellikle kim yapar?",
  },
  {
    dim: "chores",
    type: "balance",
    text: "Çöp atmak, market listesi gibi küçük ama sürekli işleri genellikle kim hatırlar/yapar?",
  },
  {
    dim: "chores",
    type: "likert",
    text: "Kim hangi işi yapacak konusunda net bir anlayışımız var.",
  },

  {
    dim: "expenses",
    type: "likert",
    text: "Kira, fatura gibi ortak giderler zamanında ve adil şekilde bölüşülüyor.",
  },
  {
    dim: "expenses",
    type: "likert_reverse",
    text: "Ortak masrafları takip etmek ya da hatırlatmak hep bana kalıyor.",
  },
  {
    dim: "expenses",
    type: "balance",
    text: "Faturaları ödemeyi ya da takip etmeyi genellikle kim üstlenir?",
  },
  {
    dim: "expenses",
    type: "balance",
    text: "Beklenmedik bir ev masrafı (tamir, eksik eşya) çıktığında bunu genellikle kim karşılar?",
  },
  {
    dim: "expenses",
    type: "likert",
    text: "Ortak harcamaların nasıl paylaşıldığından memnunum.",
    satisfactionQuestion: true,
  },

  {
    dim: "standards",
    type: "likert",
    text: "Temizlik ve düzenle ilgili beklentilerimiz birbirine yakın.",
  },
  {
    dim: "standards",
    type: "likert_reverse",
    text: "Evin düzeni/temizliği konusunda sık sık hayal kırıklığına uğruyorum.",
  },
  {
    dim: "standards",
    type: "balance",
    text: "Ortak alanların toplanması gerektiğinde, bu işi genellikle kim üstlenir?",
  },
  {
    dim: "standards",
    type: "likert_reverse",
    text: "Ev standartlarımız (temizlik, düzen, sessizlik saatleri) benim istediğim yönde ayarlanmıyor; uyum sağlamak bana kalıyor.",
  },
  {
    dim: "standards",
    type: "likert",
    text: "Farklı temizlik alışkanlıklarımız olsa da bir orta yol bulabiliyoruz.",
  },

  {
    dim: "communication",
    type: "likert",
    text: "Ev ile ilgili bir sorun olduğunda bunu doğrudan konuşabiliriz.",
  },
  {
    dim: "communication",
    type: "likert_reverse",
    text: "Rahatsız olduğum bir şeyi söylemek yerine içimde tutarım.",
  },
  {
    dim: "communication",
    type: "balance",
    text: "Ev kurallarıyla ilgili bir konu değişmesi gerektiğinde bunu genellikle kim gündeme getirir?",
  },
  {
    dim: "communication",
    type: "likert_reverse",
    text: "Anlaşmazlık yaşadığımızda konuyu konuşmak yerine görmezden gelmeyi tercih ederiz.",
  },
  {
    dim: "communication",
    type: "likert",
    text: "Ev arkadaşımın beni dinlediğini ve ciddiye aldığını hissederim.",
  },
  {
    dim: "communication",
    type: "likert",
    text: "Evle ilgili tartışmalardan sonra ilişkimizi yeniden normale döndürebiliyoruz.",
    satisfactionQuestion: true,
  },

  {
    dim: "guests",
    type: "likert",
    text: "Misafir ağırlama konusunda (sıklık, önceden haber verme) ortak bir anlayışımız var.",
  },
  {
    dim: "guests",
    type: "likert_reverse",
    text: "Ev arkadaşımın misafiri evde olduğunda kendimi rahatsız hissederim.",
  },
  {
    dim: "guests",
    type: "balance",
    text: "Ortak alanı (salon, mutfak) kullanma önceliği bir etkinlik/misafir söz konusu olduğunda genellikle kime göre belirlenir?",
  },
  {
    dim: "guests",
    type: "likert_reverse",
    text: "Misafir getirmeden önce haber vermek bende bir yük ya da gerginlik yaratıyor.",
  },
  {
    dim: "guests",
    type: "likert",
    text: "Ortak alanları kullanırken birbirimizin planlarını/ihtiyaçlarını gözetiriz.",
  },

  {
    dim: "privacy",
    type: "likert",
    text: "Kişisel eşyalarım ve özel alanım (odam) izinsiz kullanılmaz.",
  },
  {
    dim: "privacy",
    type: "likert_reverse",
    text: "Gürültü (müzik, telefon görüşmesi, geç saatte hareket etmek) konusunda sık sık rahatsız oluyorum.",
  },
  {
    dim: "privacy",
    type: "balance",
    text: "Sessizlik saatlerine ya da ortak kurallara uymayı genellikle kim daha çok hatırlatmak zorunda kalır?",
  },
  {
    dim: "privacy",
    type: "likert",
    text: "Ev arkadaşım kişisel sınırlarıma (eşyam, zamanım, özel alanım) saygı gösterir.",
  },
  {
    dim: "privacy",
    type: "likert_reverse",
    text: "Evde kendimi tam anlamıyla rahat ve özgür hissetmiyorum.",
  },
];

const questions: Question[] = RAW_QUESTIONS.map((q, i) => ({
  id: i,
  dim: q.dim,
  type: q.type,
  text: q.text,
  options: q.type === "balance" ? ROOMMATE_BALANCE : OPTION_SETS[q.type],
  satisfactionQuestion: q.satisfactionQuestion,
}));

export const roommateTest: TestDefinition = {
  id: "roommate",
  slug: "ev-arkadasligi-testi",
  name: "Ev Arkadaşlığı Yapısı Anlık Görünümü",
  subtitle: "6 boyut · 31 soru · ~7 dakika",
  inviteCta: "Ev arkadaşını davet et",
  dimensions,
  indices,
  questions,
};

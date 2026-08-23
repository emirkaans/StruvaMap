import type {
  ContextQuestion,
  Dimension,
  IndexDef,
  Option,
  Question,
  QuestionType,
  TestDefinition,
} from "../types.js";
import { OPTION_SETS } from "../option-sets.js";

const contextQuestions: ContextQuestion[] = [
  {
    id: "role",
    text: "Bu testi kim dolduruyor?",
    options: [
      { label: "Ebeveyn", value: "parent" },
      { label: "Çocuk (yetişkin çocuk dahil)", value: "child" },
    ],
  },
  {
    id: "childAge",
    text: "Çocuk (sen ya da testteki çocuk) 18 yaşından küçük mü?",
    options: [
      { label: "Evet, 18 yaşından küçük", value: "under18" },
      { label: "Hayır, 18 yaşında ya da daha büyük", value: "over18" },
    ],
  },
];

const FAMILY_BALANCE: Option[] = [
  { label: "Neredeyse her zaman ben", score: 0 },
  { label: "Çoğunlukla ben", score: 50 },
  { label: "Yaklaşık eşit", score: 100 },
  { label: "Çoğunlukla diğer taraf", score: 50 },
  { label: "Neredeyse her zaman diğer taraf", score: 0 },
];

const dimensions: Record<string, Dimension> = {
  decision: {
    id: "decision",
    name: "Karar Payı",
    short: "Hayatını ilgilendiren kararlarda sözün geçiyor mu?",
    index: "power",
    interpretation: {
      yüksek:
        "Kararlar büyük ölçüde birlikte alınıyor; söz hakkı dengeli paylaşılmış görünüyor.",
      orta: "Kararlar çoğunlukla paylaşılıyor, ancak bazı konularda söz hakkı tek tarafta yoğunlaşabiliyor.",
      düşük:
        "Kararların belirgin biçimde tek tarafta toplandığı görülüyor. Bu bir 'karar asimetrisi' işaretidir.",
    },
    conditionalNotes: [
      {
        contextQuestionId: "childAge",
        whenValue: "under18",
        band: "düşük",
        note: "Not: çocuk 18 yaşından küçükse düşük karar payı yaşa uygun, gelişimsel olarak beklenen bir durum olabilir; tek başına sorun anlamına gelmez.",
      },
    ],
  },
  listening: {
    id: "listening",
    name: "Sözün Dinlenmesi",
    short:
      "Konuşurken sözün kesilmeden, öğüt yağmuruna tutulmadan dinleniyor musun?",
    index: "power",
    interpretation: {
      yüksek:
        "Konuşma karşılıklı akıyor; taraflar birbirini sözünü kesmeden dinliyor.",
      orta: "Dinlenme çoğunlukla var, ancak zaman zaman söz kesilebiliyor ya da istenmeyen öğüt gelebiliyor.",
      düşük:
        "Konuşmada belirgin bir taraf hep konuşan, diğeri hep dinleyen konumda kalıyor.",
    },
    conditionalNotes: [
      {
        contextQuestionId: "childAge",
        whenValue: "under18",
        band: "düşük",
        note: "Not: çocuk 18 yaşından küçükse ebeveynin yönlendirici konuşması (öğüt, yönlendirme) yaşa uygun bir ebeveynlik biçimi olabilir; tek başına sorun anlamına gelmez.",
      },
    ],
  },
  emotionalLabour: {
    id: "emotionalLabour",
    name: "Duygusal Emek",
    short: "Zor anda moral desteği kimden kime akıyor?",
    index: "labour",
    interpretation: {
      yüksek:
        "Duygusal destek karşılıklı akıyor; teselli etme emeği tek tarafta yığılmıyor.",
      orta: "Destek çoğunlukla karşılıklı, ancak bazı dönemlerde bir taraf daha çok veren konumda kalıyor.",
      düşük:
        "Duygusal emeğin belirgin biçimde bir tarafta yoğunlaştığı görülüyor.",
    },
    conditionalNotes: [
      {
        contextQuestionId: "childAge",
        whenValue: "under18",
        band: "düşük",
        note: "Not: çocuk 18 yaşından küçükse duygusal desteğin ağırlıklı olarak ebeveynden çocuğa akması yaşa uygun, gelişimsel olarak beklenen bir durumdur; tek başına sorun anlamına gelmez. Tersi yönde bir örüntü (çocuğun ebeveynini duygusal olarak desteklemesi/yatıştırması) ayrıca değerlendirilmelidir.",
      },
    ],
  },
  practicalSupport: {
    id: "practicalSupport",
    name: "Pratik Destek",
    short: "Zaman, para, iş gücü gibi somut yardım nasıl dağılıyor?",
    index: "labour",
    interpretation: {
      yüksek:
        "Somut destek (zaman, para, iş gücü) iki yönlü akıyor; yük tek tarafta yığılmıyor.",
      orta: "Somut destek çoğunlukla karşılıklı, ancak bazı dönemlerde yük bir tarafa kayabiliyor.",
      düşük: "Pratik yükün belirgin biçimde bir tarafta toplandığı görülüyor.",
    },
    conditionalNotes: [
      {
        contextQuestionId: "childAge",
        whenValue: "under18",
        band: "düşük",
        note: "Not: çocuk 18 yaşından küçükse maddi ve pratik desteğin ağırlıklı olarak ebeveynden çocuğa akması yaşa uygun, gelişimsel olarak beklenen bir durumdur; tek başına sorun anlamına gelmez.",
      },
    ],
  },
  trust: {
    id: "trust",
    name: "Güven ve Kontrol",
    short: "İlişki güvenle mi, kontrolle mi yürüyor?",
    index: "autonomy",
    interpretation: {
      yüksek:
        "Güven baskın; sürekli kontrol ya da denetleme ihtiyacı hissedilmiyor.",
      orta: "Güven çoğunlukla var, ancak bazı konularda kontrol öne çıkabiliyor.",
      düşük:
        "Kontrol eğilimi belirgin; güven yerine sürekli denetim öne çıkıyor görünüyor.",
    },
  },
  privacy: {
    id: "privacy",
    name: "Özel Alan",
    short: "Kişisel sınırlar ve mahremiyet korunuyor mu?",
    index: "autonomy",
    interpretation: {
      yüksek: "Kişisel alan ve mahremiyet büyük ölçüde korunuyor.",
      orta: "Özel alan çoğunlukla korunuyor, ancak zaman zaman ihlal edilebiliyor.",
      düşük: "Kişisel alana ya da mahremiyete belirgin bir taşma görülüyor.",
    },
  },
};

const indices: Record<string, IndexDef> = {
  power: {
    id: "power",
    name: "Güç",
    desc: "Karar mekanizması ve konuşmadaki söz dengesi.",
  },
  labour: {
    id: "labour",
    name: "Emek",
    desc: "Duygusal ve pratik desteğin dağılımı.",
  },
  autonomy: {
    id: "autonomy",
    name: "Özerklik",
    desc: "Güven, kontrol ve kişisel sınırlar.",
  },
};

const RAW_QUESTIONS: {
  dim: string;
  type: QuestionType;
  text: string;
  satisfactionQuestion?: boolean;
  textByRole?: Record<string, string>;
}[] = [
  {
    dim: "decision",
    type: "likert",
    text: "Beni ilgilendiren kararlarda (iş, sağlık, ilişki, para) görüşüm sorulur.",
    textByRole: {
      parent:
        "Çocuğumu ilgilendiren kararlarda (okul, sağlık, arkadaşlıkları, harçlığı) görüşünü alırım.",
      child:
        "Beni ilgilendiren kararlarda (iş, sağlık, ilişki, para) görüşüm sorulur.",
    },
  },
  {
    dim: "decision",
    type: "likert_reverse",
    text: "Hayatımla ilgili kararlar bana danışılmadan, benim adıma alınır.",
    textByRole: {
      parent: "Çocuğumla ilgili kararları ona danışmadan, onun adına alırım.",
      child: "Hayatımla ilgili kararlar bana danışılmadan, benim adıma alınır.",
    },
  },
  {
    dim: "decision",
    type: "balance",
    text: "Görüşme sıklığı, tatil planı gibi ortak konularda son kararı genellikle kim verir?",
  },
  {
    dim: "decision",
    type: "likert",
    text: "Farklı düşündüğümde bunu söylemekten çekinmem.",
  },
  {
    dim: "decision",
    type: "balance",
    text: "Aile kuralları ya da beklentiler değiştiğinde bunu genellikle kim başlatır?",
  },

  {
    dim: "listening",
    type: "likert",
    text: "Bir konuyu anlatırken sözüm kesilmeden sonuna kadar dinlenirim.",
  },
  {
    dim: "listening",
    type: "likert_reverse",
    text: "Bir şey anlattığımda önce dinlenmek yerine hemen öğüt ya da eleştiriyle karşılaşırım.",
  },
  {
    dim: "listening",
    type: "likert_reverse",
    text: "İstemediğim halde sürekli tavsiye ya da yönlendirme alırım.",
  },
  {
    dim: "listening",
    type: "likert",
    text: "Farklı düşündüğümde, tartışmaya dönmeden önce görüşüm gerçekten dinlenir.",
  },
  {
    dim: "listening",
    type: "balance",
    text: "Sohbetlerde konuşma süresi ve yönü genellikle kim belirler?",
  },

  {
    dim: "emotionalLabour",
    type: "likert",
    text: "Zor bir dönemde ebeveynimle aramızda moral desteği karşılıklı işler.",
    textByRole: {
      "child:under18": "Zor bir dönemde ebeveynimden moral desteği alırım.",
      "parent:under18": "Çocuğum zor bir dönemden geçerken ona moral desteği veririm.",
    },
  },
  {
    dim: "emotionalLabour",
    type: "likert_reverse",
    text: "Duygusal olarak hep ben teselli ediyorum, bana aynı şekilde davranılmıyor.",
    textByRole: {
      "child:under18":
        "Üzgün ya da kaygılı olduğumda ebeveynim beni teselli etmekte zorlanır ya da yetersiz kalır.",
      "parent:under18":
        "Çocuğumu duygusal olarak teselli etmekte zorlanıyorum ya da yetersiz kalıyorum.",
    },
  },
  {
    dim: "emotionalLabour",
    type: "likert",
    text: "Üzgün ya da kaygılı olduğumda yanımda birinin olacağını bilirim.",
  },
  {
    dim: "emotionalLabour",
    type: "balance",
    text: "Gerginlik ya da tartışma sonrası ortamı yatıştırma çabasını genellikle kim gösterir?",
  },
  {
    dim: "emotionalLabour",
    type: "likert_reverse",
    text: "Kendi duygusal yükümü paylaşmak, karşı tarafı üzeceğim kaygısıyla zorlaşıyor.",
  },
  {
    dim: "emotionalLabour",
    type: "likert",
    text: "Aramızdaki duygusal destekten memnunum.",
    satisfactionQuestion: true,
  },

  {
    dim: "practicalSupport",
    type: "likert",
    text: "İhtiyaç olduğunda (para, zaman, iş gücü) her iki taraf da birbirine destek olur.",
    textByRole: {
      "child:under18": "İhtiyacım olduğunda (zaman, ilgi, temel ihtiyaçlar) ebeveynimden destek görürüm.",
      "parent:under18": "Çocuğumun ihtiyaç duyduğu zaman, ilgi ve temel ihtiyaçlarını karşılarım.",
    },
  },
  {
    dim: "practicalSupport",
    type: "balance",
    text: "Pratik bir yardım gerektiğinde (taşınma, tamir, iş takibi, bakım) bunu genellikle kim üstlenir?",
    textByRole: {
      under18:
        "Evle ilgili günlük pratik işlerde (temizlik, düzen, küçük görevler) çocuğun yaşına uygun bir pay üstlenmesi nasıl sağlanır — bunu genellikle kim üstlenir?",
    },
  },
  {
    dim: "practicalSupport",
    type: "likert_reverse",
    text: "Hep ben yardım ediyorum, karşılığında aynı desteği görmüyorum.",
    textByRole: {
      "child:under18":
        "Ebeveynimin bana verdiği desteğin karşılığında benden yaşımın üstünde bir şey beklendiğini hissederim.",
      "parent:under18":
        "Çocuğuma verdiğim destek karşılığında ondan yaşının üstünde bir şey beklediğimi fark ediyorum.",
    },
  },
  {
    dim: "practicalSupport",
    type: "likert",
    text: "Maddi ya da pratik konularda yük adil paylaşılıyor.",
    satisfactionQuestion: true,
    textByRole: {
      "child:under18": "Maddi ve pratik ihtiyaçlarımın yeterince karşılandığını düşünüyorum.",
      "parent:under18": "Çocuğumun maddi ve pratik ihtiyaçlarını yeterince karşılayabildiğimi düşünüyorum.",
    },
  },
  {
    dim: "practicalSupport",
    type: "balance",
    text: "Acil bir durumda (hastalık, kriz, ani ihtiyaç) ilk koşan genellikle kim olur?",
  },

  {
    dim: "trust",
    type: "likert",
    text: "Kararlarıma ve seçimlerime güvenilir; sürekli sorgulanmam.",
    textByRole: {
      parent:
        "Çocuğumun kararlarına ve seçimlerine güvenirim; onu sürekli sorgulamam.",
      child: "Kararlarıma ve seçimlerime güvenilir; sürekli sorgulanmam.",
    },
  },
  {
    dim: "trust",
    type: "likert_reverse",
    text: "Yaptığım her şey denetlenir ya da hesap sorulur gibi hissettirir.",
    textByRole: {
      parent:
        "Çocuğumun yaptığı her şeyi denetleme ya da hesap sorma ihtiyacı hissederim.",
      child:
        "Yaptığım her şey denetlenir ya da hesap sorulur gibi hissettirir.",
    },
  },
  {
    dim: "trust",
    type: "balance",
    text: "Bir konuda 'doğrusu budur' diyerek son sözü genellikle kim söyler?",
  },
  {
    dim: "trust",
    type: "likert",
    text: "Hata yapma alanım var; her adımım mercek altında değil.",
    textByRole: {
      parent:
        "Çocuğuma hata yapma alanı tanırım; her adımını mercek altına almam.",
      child: "Hata yapma alanım var; her adımım mercek altında değil.",
    },
  },
  {
    dim: "trust",
    type: "likert_reverse",
    text: "Farklı bir yol denemem ya da fikrimi değiştirmem onay gerektirir gibi hissettirir.",
    textByRole: {
      parent:
        "Çocuğumun farklı bir yol denemesi ya da fikrini değiştirmesi için onayımı şart koşarım.",
      child:
        "Farklı bir yol denemem ya da fikrimi değiştirmem onay gerektirir gibi hissettirir.",
    },
  },

  {
    dim: "privacy",
    type: "likert",
    text: "Kişisel alanım (evim, eşyalarım, zamanım) bu ilişkide gözetilir.",
    textByRole: {
      child: "Kişisel alanım (evim, eşyalarım, zamanım) bu ilişkide gözetilir.",
      parent: "Çocuğumun kişisel alanını (evini, eşyalarını, zamanını) gözetirim.",
    },
  },
  {
    dim: "privacy",
    type: "likert_reverse",
    text: "İzinsiz eşyalarıma bakılır ya da özel alanıma girilir.",
    textByRole: {
      parent:
        "Çocuğumun eşyalarına ya da özel alanına izinsiz girdiğim oluyor.",
      child: "İzinsiz eşyalarıma bakılır ya da özel alanıma girilir.",
    },
  },
  {
    dim: "privacy",
    type: "likert_reverse",
    text: "Kişisel tercihlerime (kiminle görüştüğüm, zamanımı nasıl geçirdiğim, param) izinsiz karışılır.",
    textByRole: {
      parent:
        "Çocuğumun kişisel tercihlerine (kiminle görüştüğü, zamanını nasıl geçirdiği, parası) izinsiz karışırım.",
      child:
        "Kişisel tercihlerime (kiminle görüştüğüm, zamanımı nasıl geçirdiğim, param) izinsiz karışılır.",
    },
  },
  {
    dim: "privacy",
    type: "likert",
    text: "Bu ilişkide hayır dediğimde ya da sınır koyduğumda kendimi suçlu veya kötü hissetmiyorum.",
    textByRole: {
      child: "Bu ilişkide hayır dediğimde ya da sınır koyduğumda kendimi suçlu veya kötü hissetmiyorum.",
      parent:
        "Çocuğum hayır dediğinde ya da sınır koyduğunda bunu doğal karşılarım; onu suçlu ya da kötü hissettirmem.",
    },
  },
  {
    dim: "privacy",
    type: "likert_reverse",
    text: "Mahremiyetimle ilgili sorular ya da müdahaleler rahatsız edici sıklıkta oluyor.",
    textByRole: {
      child: "Mahremiyetimle ilgili sorular ya da müdahaleler rahatsız edici sıklıkta oluyor.",
      parent:
        "Çocuğumun mahremiyetiyle ilgili sorularım ya da müdahalelerim onu rahatsız edecek sıklıkta oluyor.",
    },
  },
];

const questions: Question[] = RAW_QUESTIONS.map((q, i) => ({
  id: i,
  dim: q.dim,
  type: q.type,
  text: q.text,
  options: q.type === "balance" ? FAMILY_BALANCE : OPTION_SETS[q.type],
  satisfactionQuestion: q.satisfactionQuestion,
  textByRole: q.textByRole,
}));

export const familyTest: TestDefinition = {
  id: "family",
  slug: "aile-iliskisi-testi",
  name: "Ebeveyn-Çocuk İlişkisi Yapısı Anlık Görünümü",
  subtitle: "6 boyut · 31 soru · ~7 dakika",
  inviteCta: "Ebeveynini ya da çocuğunu davet et",
  contextQuestions,
  disclaimerNote:
    "Ebeveyn-çocuk ilişkisinde bazı asimetriler (ör. yaşa bağlı karar payı farkı) yapısal olarak meşrudur; her asimetri sorun anlamına gelmez.",
  dimensions,
  indices,
  questions,
};

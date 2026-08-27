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
      { label: "Yönetici", value: "manager" },
      { label: "Çalışan", value: "employee" },
    ],
  },
];

const WORK_BALANCE: Option[] = [
  { label: "Neredeyse her zaman ben", score: 0 },
  { label: "Çoğunlukla ben", score: 50 },
  { label: "Yaklaşık eşit", score: 100 },
  { label: "Çoğunlukla diğer taraf", score: 50 },
  { label: "Neredeyse her zaman diğer taraf", score: 0 },
];

/* "kim başlatır" tarzı sınır-ihlali sorularında "eşit" iyi değildir; ikisi de
   eşit sıklıkla sınırı ihlal ediyor demektir. Burada asıl eksen kim değil,
   sıklık — hiç olmaması en iyisi, sık ve karşılıklı olması en kötüsü. */
const BOUNDARY_INITIATION: Option[] = [
  { label: "Hiçbirimiz başlatmıyor, bu neredeyse hiç olmuyor", score: 100 },
  { label: "Nadiren oluyor", score: 80 },
  { label: "Bazen oluyor, çoğunlukla tek taraf başlatıyor", score: 50 },
  { label: "Sık sık oluyor, çoğunlukla tek taraf başlatıyor", score: 20 },
  { label: "Sık sık oluyor, ikimiz de başlatıyoruz", score: 0 },
];

const dimensions: Record<string, Dimension> = {
  decision: {
    id: "decision",
    name: "Karar Payı",
    short: "Kararlarda sesin ne kadar duyuluyor?",
    index: "power",
    interpretation: {
      yüksek:
        "Kararları çoğunlukla birlikte alıyorsunuz; söz hakkı ve yetki dengeli paylaşılmış görünüyor.",
      orta: "Kararların çoğunu birlikte alıyorsunuz ama bazı konularda söz hakkı tek kişide toplanabiliyor.",
      düşük:
        "Kararlar büyük ölçüde tek kişide toplanmış görünüyor.",
    },
    conditionalNotes: [
      {
        contextQuestionId: "role",
        whenValue: "employee",
        band: "düşük",
        note: "Not: yöneticinin son sözü söylemesi normal bir hiyerarşinin parçası olabilir; tek başına sorun anlamına gelmez.",
      },
    ],
  },
  feedback: {
    id: "feedback",
    name: "Geri Bildirim Yönü",
    short: "Geri bildirim tek yönlü mü, karşılıklı mı akıyor?",
    index: "power",
    interpretation: {
      yüksek:
        "Geri bildirim iki yönlü akıyor; birbirinize açıkça geri bildirim verebiliyorsunuz.",
      orta: "Geri bildirim akıyor ama çoğunlukla hep aynı yönde, aynı kişiden diğerine.",
      düşük:
        "Geri bildirim büyük ölçüde tek yönlü görünüyor. Bu, sessiz kalan tarafın fikrinin duyulmadığı bir yapıya işaret edebilir.",
    },
    conditionalNotes: [
      {
        contextQuestionId: "role",
        whenValue: "employee",
        band: "düşük",
        note: "Not: hiyerarşik yapılarda geri bildirimin çoğunlukla yöneticiden çalışana akması beklenen bir durum olabilir; tek başına sorun anlamına gelmez.",
      },
    ],
  },
  workload: {
    id: "workload",
    name: "İş Yükü Adaleti",
    short: "İş yükü ve sorumluluk dağılımı adil mi?",
    index: "labour",
    interpretation: {
      yüksek: "İş yükü ve sorumluluk dağılımını dengeli buluyorsunuz.",
      orta: "İş yükünde ölçülü bir dengesizlik var; bazı dönemlerde yük bir tarafa kayabiliyor.",
      düşük: "İş yükünün çoğu tek bir kişide toplanmış görünüyor.",
    },
  },
  recognition: {
    id: "recognition",
    name: "Görünürlük ve Takdir",
    short: "Emek fark ediliyor, katkı takdir görüyor mu?",
    index: "labour",
    interpretation: {
      yüksek: "Emeğiniz görülüyor ve karşılığında takdir geliyor.",
      orta: "Katkınız çoğunlukla fark ediliyor ama takdir düzenli gelmiyor.",
      düşük:
        "Emeğin fark edilmediği ya da takdirin eksik kaldığı bir yapı öne çıkıyor.",
    },
  },
  trust: {
    id: "trust",
    name: "Güven ve Mikro-yönetim",
    short: "İş nasıl takip ediliyor: güvenle mi, kontrolle mi?",
    index: "autonomy",
    interpretation: {
      yüksek:
        "İş güvenle bırakılıyor; sürekli kontrol edilme ihtiyacı yok.",
      orta: "Genelde güven var ama bazı konularda yakın takip/kontrol öne çıkabiliyor.",
      düşük:
        "İş, güvenmek yerine sürekli kontrol edilerek takip ediliyor görünüyor.",
    },
  },
  boundaries: {
    id: "boundaries",
    name: "Sınırlar",
    short: "Mesai dışı zaman ve kişisel alan korunuyor mu?",
    index: "autonomy",
    interpretation: {
      yüksek: "Mesai dışı zamanınız ve kişisel alanınız büyük ölçüde korunuyor.",
      orta: "Sınırlar çoğunlukla korunuyor ama zaman zaman aşılabiliyor.",
      düşük:
        "Mesai dışı zamana ya da kişisel alana sık sık girildiği görülüyor.",
    },
  },
};

const indices: Record<string, IndexDef> = {
  power: {
    id: "power",
    name: "Güç",
    desc: "Karar ve geri bildirim yönünün dengesi.",
  },
  labour: {
    id: "labour",
    name: "Emek",
    desc: "İş yükü dağılımı ve emeğin görünürlüğü.",
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
  options?: Option[];
}[] = [
  {
    dim: "decision",
    type: "likert",
    text: "Bu iş ilişkisinde önemli kararlar genellikle birlikte alınır.",
  },
  {
    dim: "decision",
    type: "likert_reverse",
    text: "Bir konuda görüş ayrılığı olduğunda son sözü hep aynı taraf söyler.",
  },
  {
    dim: "decision",
    type: "balance",
    text: "Görev dağılımı ve önceliklerle ilgili son kararı genellikle kim verir?",
  },
  {
    dim: "decision",
    type: "likert",
    text: "Görüşümün karar süreçlerinde gerçekten dikkate alındığını hissederim.",
    textByRole: {
      employee: "Görüşümün karar süreçlerinde gerçekten dikkate alındığını hissederim.",
      manager: "Çalışanımın görüşünü karar süreçlerinde gerçekten dikkate aldığımı hissederim.",
    },
  },
  {
    dim: "decision",
    type: "balance",
    text: "Toplantılarda gündemi ve yönü genellikle kim belirler?",
  },

  {
    dim: "feedback",
    type: "likert",
    text: "Geri bildirim bu ilişkide iki yönlü işler; sadece bir taraf değerlendirilmez.",
  },
  {
    dim: "feedback",
    type: "likert_reverse",
    text: "Geri bildirim hep aynı yönde akar; karşı tarafa geri bildirim vermek zor hissettirir.",
  },
  {
    dim: "feedback",
    type: "likert",
    text: "Eleştiri ya da düzeltme geri bildirimini savunmaya geçmeden, rahatça alabilirim.",
  },
  {
    dim: "feedback",
    type: "balance",
    text: "Performans ya da yaklaşımla ilgili geri bildirimi genellikle kim kime verir?",
  },
  {
    dim: "feedback",
    type: "likert_reverse",
    text: "Bir şeyi eleştirmek istediğimde sonuçlarından çekindiğim için sessiz kalırım.",
    textByRole: {
      employee: "Bir şeyi eleştirmek istediğimde sonuçlarından çekindiğim için sessiz kalırım.",
      manager:
        "Çalışanımı eleştirmek istediğimde bunun ilişkimizi zedelemesinden ya da onu demotive etmesinden çekindiğim için sessiz kalırım.",
    },
  },

  {
    dim: "workload",
    type: "likert",
    text: "İş yükü ve sorumluluk dağılımını adil buluyorum.",
    satisfactionQuestion: true,
  },
  {
    dim: "workload",
    type: "balance",
    text: "Ani ya da ek işler çıktığında bunu genellikle kim üstlenir?",
  },
  {
    dim: "workload",
    type: "likert_reverse",
    text: "İş yükümün kapasitemin üzerinde olduğunu sık sık hissederim.",
  },
  {
    dim: "workload",
    type: "balance",
    text: "Uzun süren yoğun dönemlerde bu ek yükü sürekli olarak genellikle kim taşır?",
  },
  {
    dim: "workload",
    type: "likert",
    text: "İş dağılımı yapılırken herkesin mevcut yükü dikkate alınır.",
  },

  {
    dim: "recognition",
    type: "likert",
    text: "Yaptığım katkı fark edilir ve takdir edilir.",
  },
  {
    dim: "recognition",
    type: "likert_reverse",
    text: "Emeğimin görünmediğini ya da es geçildiğini hissettiğim oluyor.",
  },
  {
    dim: "recognition",
    type: "balance",
    text: "Bir işin başarısı konuşulduğunda kimin katkısı daha çok öne çıkar?",
  },
  {
    dim: "recognition",
    type: "likert",
    text: "Başarı kadar emek de görülür; sadece sonuç değil çaba da fark edilir.",
  },
  {
    dim: "recognition",
    type: "likert_reverse",
    text: "Teşekkür ya da takdir hep aynı taraftan diğerine gider, karşılığı gelmez.",
  },
  {
    dim: "recognition",
    type: "likert",
    text: "Emeğimin görünürlüğü ve takdir edilme biçiminden memnunum.",
    satisfactionQuestion: true,
  },

  {
    dim: "trust",
    type: "likert",
    text: "Bu ilişkide iş, sürekli kontrol yerine güvenle devredilir.",
    textByRole: {
      manager:
        "Bu ilişkide işi çalışanıma sürekli kontrol yerine güvenle devrederim.",
      employee: "Bu ilişkide iş, sürekli kontrol yerine güvenle devredilir.",
    },
  },
  {
    dim: "trust",
    type: "likert_reverse",
    text: "Aynı işin durumu gün içinde birkaç kez sorulur ya da kontrol edilir.",
    textByRole: {
      manager:
        "Aynı işin durumunu gün içinde birkaç kez sorar ya da kontrol ederim.",
      employee:
        "Aynı işin durumu gün içinde birkaç kez sorulur ya da kontrol edilir.",
    },
  },
  {
    dim: "trust",
    type: "balance",
    text: "Bir işi hangi yöntemle yürüteceğime dair son sözü genellikle kim söyler?",
  },
  {
    dim: "trust",
    type: "likert",
    text: "Hata yapma alanı tanınır; her adım mikroskop altında değildir.",
    textByRole: {
      manager:
        "Çalışanıma hata yapma alanı tanırım; her adımını mikroskop altına almam.",
      employee:
        "Hata yapma alanı tanınır; her adım mikroskop altında değildir.",
    },
  },
  {
    dim: "trust",
    type: "likert_reverse",
    text: "Onay almadan atılan adımlar genellikle sorgulanır.",
    textByRole: {
      manager:
        "Çalışanımın onay almadan attığı adımları genellikle sorgularım.",
      employee: "Onay almadan atılan adımlar genellikle sorgulanır.",
    },
  },

  {
    dim: "boundaries",
    type: "likert",
    text: "Mesai dışı saatlerde iş mesajlarına anında yanıt verme baskısı hissetmem.",
  },
  {
    dim: "boundaries",
    type: "likert_reverse",
    text: "İzin ya da tatil günlerinde bile iş konularıyla ilgili bana ulaşılır.",
  },
  {
    dim: "boundaries",
    type: "likert_reverse",
    text: "İzin ya da tatil günlerinde bile iş konularıyla ilgili ben ulaşırım.",
  },
  {
    dim: "boundaries",
    type: "likert",
    text: "Kişisel sınırlarım (mesai, izin, özel hayat) bu ilişkide gözetilir.",
  },
  {
    dim: "boundaries",
    type: "balance",
    text: "Mesai dışı saatlerde iş için ulaşma ne sıklıkta oluyor ve genellikle kim başlatıyor?",
    options: BOUNDARY_INITIATION,
  },
  {
    dim: "boundaries",
    type: "likert_reverse",
    text: "Hayır dediğimde ya da sınır koyduğumda karşı tarafın tepkisinden çekinirim.",
    textByRole: {
      employee: "Hayır dediğimde ya da sınır koyduğumda karşı tarafın tepkisinden çekinirim.",
      manager: "Çalışanım hayır dediğinde ya da sınır koyduğunda bundan rahatsızlık duyarım.",
    },
  },
];

const questions: Question[] = RAW_QUESTIONS.map((q, i) => ({
  id: i,
  dim: q.dim,
  type: q.type,
  text: q.text,
  options: q.options ?? (q.type === "balance" ? WORK_BALANCE : OPTION_SETS[q.type]),
  satisfactionQuestion: q.satisfactionQuestion,
  textByRole: q.textByRole,
}));

export const workTest: TestDefinition = {
  id: "work",
  slug: "is-iliskisi-testi",
  name: "İş İlişkisi Yapısı Anlık Görünümü",
  subtitle: "6 boyut · 32 soru · ~7 dakika",
  inviteCta: "Yöneticini ya da çalışanını davet et",
  contextQuestions,
  disclaimerNote:
    "İş ilişkisinde bazı asimetriler (ör. yöneticinin son sözü olması) meşru hiyerarşinin parçasıdır; her asimetri sorun anlamına gelmez.",
  dimensions,
  indices,
  questions,
};

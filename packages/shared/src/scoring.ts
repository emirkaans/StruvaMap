import type {
  Answers,
  Band,
  ContextAnswers,
  ContextQuestion,
  DimensionInterpretation,
  IndexDef,
  Question,
  ScoreResult,
  ScoringThresholds,
  TestDefinition,
} from "./types.js";

export const DEFAULT_THRESHOLDS: ScoringThresholds = {
  tensionThreshold: 55,
  strengthThreshold: 75,
};

export function computeScores(
  test: TestDefinition,
  answers: Answers,
  thresholds: ScoringThresholds = DEFAULT_THRESHOLDS,
  contextAnswers?: ContextAnswers,
): ScoreResult {
  const dimIds = Object.keys(test.dimensions);

  const buckets: Record<string, number[]> = {};
  for (const dimId of dimIds) buckets[dimId] = [];

  const satisfactionBuckets: Record<string, number[]> = {};

  for (const q of test.questions) {
    const chosen = answers[q.id];
    if (chosen == null) continue; // cevaplanmamış soruyu atla
    const score = q.options[chosen]?.score;
    if (score == null) continue;
    buckets[q.dim].push(score);
    if (q.satisfactionQuestion) {
      (satisfactionBuckets[q.dim] ??= []).push(score);
    }
  }

  const satisfaction: Record<string, number> = {};
  for (const dimId of Object.keys(satisfactionBuckets)) {
    const arr = satisfactionBuckets[dimId];
    if (arr.length) satisfaction[dimId] = Math.round(mean(arr));
  }

  const dimensions: Record<string, number> = {};
  for (const dimId of dimIds) {
    const arr = buckets[dimId];
    dimensions[dimId] = arr.length ? Math.round(mean(arr)) : 0;
  }

  const byIndex: Record<string, number[]> = {};
  for (const dimId of dimIds) {
    const indexId = test.dimensions[dimId].index;
    (byIndex[indexId] ??= []).push(dimensions[dimId]);
  }
  const indices: Record<string, number> = {};
  for (const indexId of Object.keys(test.indices)) {
    indices[indexId] = Math.round(mean(byIndex[indexId] ?? []));
  }

  const rsi = Math.round(mean(Object.values(dimensions)));

  const ranked = [...dimIds].sort((a, b) => dimensions[b] - dimensions[a]);
  const strengths = ranked
    .filter((d) => dimensions[d] >= thresholds.strengthThreshold)
    .slice(0, 3);
  const tensions = [...ranked]
    .reverse()
    .filter((d) => dimensions[d] < thresholds.tensionThreshold)
    .slice(0, 3);

  const interpretation: DimensionInterpretation[] = dimIds.map((dimId) => {
    const score = dimensions[dimId];
    const band = bandOf(score);
    const dim = test.dimensions[dimId];
    let text = dim.interpretation[band];
    if (contextAnswers && dim.conditionalNotes) {
      for (const cn of dim.conditionalNotes) {
        if (cn.band === band && contextAnswers[cn.contextQuestionId] === cn.whenValue) {
          text += ` ${cn.note}`;
        }
      }
    }
    return { dim: dimId, name: dim.name, score, band, text };
  });

  const result: ScoreResult = { testId: test.id, rsi, dimensions, indices, strengths, tensions, interpretation };
  if (Object.keys(satisfaction).length) result.satisfaction = satisfaction;
  return result;
}

function mean(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export interface ProfileLabel {
  title: string;
  description: string;
}

const BALANCED_GAP = 10;

/* Türkçe'de doğal liste bağlacı: "A, B ve C" (son öğeden önce "ve", virgül
   yok; iki öğede virgülsüz "A ve B"). */
function joinNamesTr(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} ve ${names[names.length - 1]}`;
}

/* İlişkiye/yapıya ait, kişiye değil: endeks skorlarından deterministik olarak
   üretilen bir "yapı profili". Test-agnostik — hangi 3 endeks olursa olsun
   (Güç/Emek/Özerklik, Karşılıklılık/Destek/Güven, Emek/Uyum/Sınırlar...) aynı
   şablonla çalışır, yeni içerik yazımı gerektirmez. Ayrık ve tam kapsamlı: her
   skor kombinasyonu tam olarak bir kovaya düşer.
   description bilerek index.desc'i (bunlar "bu endeks neyi ölçer" tanımı,
   "bu sonuçta ne oldu" bulgusu değil) doğrudan kullanmıyor — kendi kurduğumuz,
   sonucu anlatan bir cümle.
   Sadece en yüksek/en düşük ARASINDAKİ FARKA değil, en yüksek skorun MUTLAK
   seviyesine (bandOf: yüksek/orta/düşük) de bakıyor — yoksa "en az kötü" olan
   endeks "Ağırlıklı" (yani güçlü) diye sunulur. Üç endeks de 55/45/35 gibi
   zayıfsa, 55'i "güçlü yön" ilan etmek yanıltıcı olurdu. */
export function computeProfileLabel(
  indices: Record<string, IndexDef>,
  indexScores: Record<string, number>,
): ProfileLabel {
  const ids = Object.keys(indices);
  const names = ids.map((id) => indices[id].name);
  const sorted = [...ids].sort((a, b) => indexScores[b] - indexScores[a]);
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];

  if (!highest) {
    return {
      title: "Dengeli Yapı",
      description: `Bu sonuçta ${joinNamesTr(names)} arasında belirgin bir fark yok; yapı genel olarak dengeli görünüyor.`,
    };
  }

  const highScore = indexScores[highest] ?? 0;
  const lowScore = indexScores[lowest] ?? 0;
  const gap = highScore - lowScore;
  const highBand = bandOf(highScore);
  const lowBand = bandOf(lowScore);
  const highName = indices[highest].name;
  const lowName = indices[lowest].name;

  // En iyi eksen bile zayıfsa, hiçbirini "güçlü yön" diye sunma.
  if (highBand === "düşük") {
    return {
      title: "Genel Olarak Gerilimli Yapı",
      description: `Bu sonuçta ${joinNamesTr(names)} eksenlerinin hiçbiri güçlü görünmüyor; genel olarak gerilimli bir tablo var.`,
    };
  }
  if (gap < BALANCED_GAP) {
    return {
      title: "Dengeli Yapı",
      description: `Bu sonuçta ${joinNamesTr(names)} arasında belirgin bir fark yok; yapı genel olarak dengeli görünüyor.`,
    };
  }
  if (highBand === "yüksek") {
    if (lowBand === "düşük") {
      return {
        title: `${highName} Ağırlıklı, ${lowName} Gerilimli`,
        description: `Bu sonuçta ${highName} güçlü bir örüntü gösterirken, ${lowName} tarafı geride kalıyor.`,
      };
    }
    return {
      title: `${highName} Ağırlıklı Yapı`,
      description: `Bu sonuçta en çok öne çıkan eksen ${highName}; diğer alanlara kıyasla burada daha net bir örüntü var.`,
    };
  }
  // highBand "orta": hiçbir eksen gerçekten güçlü değil, ama biri belirgin
  // şekilde geride kalıyorsa onu (zayıf olanı) adlandırmak, olmayan bir
  // güçlü yön uydurmaktan daha dürüst.
  if (lowBand === "düşük") {
    return {
      title: `${lowName} Gerilimli Yapı`,
      description: `Bu sonuçta hiçbir eksen çok güçlü değil, ama ${lowName} özellikle geride kalıyor.`,
    };
  }
  return {
    title: "Dengeli Yapı",
    description: `Bu sonuçta ${joinNamesTr(names)} arasında belirgin bir fark yok; yapı genel olarak dengeli görünüyor.`,
  };
}

/* Profil başlığının altındaki "hikaye": kısa çerçeve cümlesinin (yukarıdaki
   description) üstüne, zaten hesaplanmış zengin cümleleri (dimension.
   interpretation, computeScores çıktısındaki strengths/tensions) ekleyerek
   akan bir paragraf kurar. Önce genel örüntüyü (endeks seviyesi) çerçeveler,
   sonra en somut iki bulguyla (en güçlü ve en gerilimli boyut) topraklar —
   aşağıdaki detaylı dökümle bilerek örtüşür, bu bir özet/giriş niyetiyle
   yazılıyor. */
export function composeProfileStory(
  profile: ProfileLabel,
  interpretation: DimensionInterpretation[],
  strengths: string[],
  tensions: string[],
): string {
  const findDim = (id?: string) => interpretation.find((it) => it.dim === id);
  const topStrength = findDim(strengths[0]);
  const topTension = findDim(tensions[0]);

  let story = profile.description;
  if (topStrength) {
    story += ` En güçlü olduğu alan ${topStrength.name}: ${topStrength.text}`;
  }
  if (topTension && topTension.dim !== topStrength?.dim) {
    story += ` Buna karşılık ${topTension.name} konusunda bir gerilim öne çıkıyor: ${topTension.text}`;
  }
  return story;
}

export function bandOf(score: number): Band {
  if (score >= 75) return "yüksek";
  if (score >= 55) return "orta";
  return "düşük";
}

/* textByRole anahtarları tekil (`"parent"`, `"under18"`) ya da contextQuestions
   sırasına göre birleşik (`"parent:under18"`) olabilir. En özelden en genele
   doğru düşer: tam birleşik anahtar → sadece ilk context değeri (role) →
   tek tek her context değeri (bu da yaş-only anahtarı yakalar). */
export function resolveQuestionText(
  question: Question,
  contextQuestions: ContextQuestion[],
  contextAnswers?: ContextAnswers,
): string {
  const map = question.textByRole;
  if (!map || !contextAnswers) return question.text;
  const values = contextQuestions
    .map((cq) => contextAnswers[cq.id])
    .filter((v): v is string => !!v);
  for (let take = values.length; take >= 1; take--) {
    const key = values.slice(0, take).join(":");
    if (map[key] != null) return map[key];
  }
  for (const v of values) {
    if (map[v] != null) return map[v];
  }
  return question.text;
}

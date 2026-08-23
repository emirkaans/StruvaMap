import { BadRequestException } from '@nestjs/common';

const BANDS = ['yüksek', 'orta', 'düşük'];
const QUESTION_TYPES = ['likert', 'likert_reverse', 'balance'];

function fail(message: string): never {
  throw new BadRequestException(`Geçersiz test tanımı: ${message}`);
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/* class-validator ile derin iç içe / opsiyonel bir şemayı (dimensions,
   questions, contextQuestions...) modellemek onlarca DTO sınıfı gerektirirdi.
   Bunun yerine tek seferlik yapısal kontrol: puanlamayı (computeScores)
   bozacak eksik/yanlış tip alanları yakalar, metin içeriğini serbest bırakır. */
export function assertValidTestDefinition(def: unknown, expectedId: string): void {
  if (!isObject(def)) fail('tanım bir obje olmalı.');

  if (def.id !== expectedId) fail(`id alanı route ile eşleşmiyor (${String(def.id)} ≠ ${expectedId}).`);
  if (typeof def.name !== 'string' || !def.name.trim()) fail('name alanı boş olamaz.');
  if (typeof def.slug !== 'string' || !def.slug.trim()) fail('slug alanı boş olamaz.');
  if (typeof def.subtitle !== 'string') fail('subtitle string olmalı.');
  if (typeof def.inviteCta !== 'string') fail('inviteCta string olmalı.');

  const contextValueSets = new Map<string, Set<string>>();
  if (def.contextQuestions !== undefined) {
    if (!Array.isArray(def.contextQuestions)) fail('contextQuestions bir dizi olmalı.');
    const seenCqIds = new Set<string>();
    for (const cq of def.contextQuestions as unknown[]) {
      if (!isObject(cq) || typeof cq.id !== 'string' || !cq.id.trim()) fail('her contextQuestion için id boş olmayan bir string olmalı.');
      if (seenCqIds.has(cq.id as string)) fail(`contextQuestions.${cq.id} birden fazla kez tanımlanmış.`);
      seenCqIds.add(cq.id as string);
      if (typeof cq.text !== 'string') fail(`contextQuestions.${cq.id}.text string olmalı.`);
      if (!Array.isArray(cq.options) || cq.options.length === 0) fail(`contextQuestions.${cq.id}.options boş olmayan bir dizi olmalı.`);
      const values = new Set<string>();
      for (const opt of cq.options as unknown[]) {
        if (!isObject(opt) || typeof opt.label !== 'string' || typeof opt.value !== 'string') {
          fail(`contextQuestions.${cq.id}: her option {label:string, value:string} şeklinde olmalı.`);
        }
        values.add(opt.value);
      }
      contextValueSets.set(cq.id as string, values);
    }
  }

  if (!isObject(def.indices) || Object.keys(def.indices).length === 0) {
    fail('indices boş olmayan bir obje olmalı.');
  }
  const indexIds = new Set(Object.keys(def.indices));
  for (const [id, idx] of Object.entries(def.indices)) {
    if (!isObject(idx) || idx.id !== id || typeof idx.name !== 'string' || typeof idx.desc !== 'string') {
      fail(`indices.${id} şekli hatalı (id/name/desc gerekli).`);
    }
  }

  if (!isObject(def.dimensions) || Object.keys(def.dimensions).length === 0) {
    fail('dimensions boş olmayan bir obje olmalı.');
  }
  const dimIds = new Set(Object.keys(def.dimensions));
  for (const [id, dim] of Object.entries(def.dimensions)) {
    if (!isObject(dim) || dim.id !== id) fail(`dimensions.${id} id alanı anahtarla eşleşmeli.`);
    if (typeof dim.name !== 'string' || !dim.name.trim()) fail(`dimensions.${id}.name boş olamaz.`);
    if (typeof dim.short !== 'string') fail(`dimensions.${id}.short string olmalı.`);
    if (typeof dim.index !== 'string' || !indexIds.has(dim.index)) {
      fail(`dimensions.${id}.index geçerli bir indices anahtarı olmalı.`);
    }
    if (!isObject(dim.interpretation)) fail(`dimensions.${id}.interpretation obje olmalı.`);
    for (const band of BANDS) {
      if (typeof (dim.interpretation as Record<string, unknown>)[band] !== 'string') {
        fail(`dimensions.${id}.interpretation.${band} string olmalı.`);
      }
    }

    if (dim.conditionalNotes !== undefined) {
      if (!Array.isArray(dim.conditionalNotes)) fail(`dimensions.${id}.conditionalNotes bir dizi olmalı.`);
      for (const note of dim.conditionalNotes as unknown[]) {
        if (
          !isObject(note) ||
          typeof note.contextQuestionId !== 'string' ||
          typeof note.whenValue !== 'string' ||
          typeof note.band !== 'string' ||
          typeof note.note !== 'string'
        ) {
          fail(`dimensions.${id}: her conditionalNote {contextQuestionId, whenValue, band, note} (hepsi string) şeklinde olmalı.`);
        }
        if (!BANDS.includes(note.band as (typeof BANDS)[number])) {
          fail(`dimensions.${id}: conditionalNote.band geçerli bir bant olmalı (${BANDS.join('/')}).`);
        }
        const values = contextValueSets.get(note.contextQuestionId as string);
        if (!values) fail(`dimensions.${id}: conditionalNote.contextQuestionId (${String(note.contextQuestionId)}) tanımlı bir contextQuestions.id'ye karşılık gelmiyor.`);
        if (!values.has(note.whenValue as string)) {
          fail(`dimensions.${id}: conditionalNote.whenValue (${String(note.whenValue)}) contextQuestions.${String(note.contextQuestionId)} seçeneklerinde yok.`);
        }
      }
    }
  }

  if (!Array.isArray(def.questions) || def.questions.length === 0) {
    fail('questions boş olmayan bir dizi olmalı.');
  }
  const seenQuestionIds = new Set<number>();
  for (const q of def.questions as unknown[]) {
    if (!isObject(q)) fail('her question bir obje olmalı.');
    if (typeof q.id !== 'number' || seenQuestionIds.has(q.id)) fail(`question id benzersiz bir sayı olmalı (${String(q.id)}).`);
    seenQuestionIds.add(q.id);
    if (typeof q.dim !== 'string' || !dimIds.has(q.dim)) fail(`question ${q.id}: dim geçerli bir dimensions anahtarı olmalı.`);
    if (typeof q.type !== 'string' || !QUESTION_TYPES.includes(q.type)) fail(`question ${q.id}: type geçersiz.`);
    if (typeof q.text !== 'string' || !q.text.trim()) fail(`question ${q.id}: text boş olamaz.`);
    if (!Array.isArray(q.options) || q.options.length === 0) fail(`question ${q.id}: options boş olmayan bir dizi olmalı.`);
    for (const opt of q.options as unknown[]) {
      if (!isObject(opt) || typeof opt.label !== 'string' || typeof opt.score !== 'number') {
        fail(`question ${q.id}: her option {label:string, score:number} şeklinde olmalı.`);
      }
    }

    if (q.textByRole !== undefined) {
      if (!isObject(q.textByRole)) fail(`question ${q.id}: textByRole bir obje olmalı.`);
      for (const [key, value] of Object.entries(q.textByRole)) {
        if (typeof value !== 'string') fail(`question ${q.id}: textByRole.${key} string olmalı.`);
      }
    }
  }
}

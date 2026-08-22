import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  OPTION_SETS,
  type Band,
  type ConditionalNote,
  type ContextQuestion,
  type Dimension,
  type IndexDef,
  type Question,
  type TestDefinition,
} from "@struva/shared";
import { AdminNav } from "../../components/AdminRoute";
import { fetchTest, updateAdminTest } from "../../lib/api";

const BANDS: Band[] = ["yüksek", "orta", "düşük"];
const BAND_LABEL: Record<Band, string> = { yüksek: "Yüksek", orta: "Orta", düşük: "Düşük" };
const QUESTION_TYPES: Question["type"][] = ["likert", "likert_reverse", "balance"];

function uniqueId(base: string, existing: Set<string>): string {
  if (!existing.has(base)) return base;
  let i = 2;
  while (existing.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

export function AdminTestEditPage() {
  const { testId } = useParams<{ testId: string }>();
  const [def, setDef] = useState<TestDefinition | null>(null);
  const [originalQuestionIds, setOriginalQuestionIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!testId) return;
    fetchTest(testId).then((t) => {
      setDef(t);
      setOriginalQuestionIds(new Set(t.questions.map((q) => q.id)));
    });
  }, [testId]);

  const indexEntries = useMemo(() => (def ? Object.entries(def.indices) : []), [def]);
  const dimensionEntries = useMemo(() => (def ? Object.entries(def.dimensions) : []), [def]);
  const contextQuestions = def?.contextQuestions ?? [];

  if (!def) {
    return (
      <main className="wrap admin-wrap">
        <AdminNav />
        <p className="muted small">Yükleniyor…</p>
      </main>
    );
  }

  function updateMeta<K extends keyof TestDefinition>(key: K, value: TestDefinition[K]) {
    setDef((d) => (d ? { ...d, [key]: value } : d));
  }

  function updateIndex(id: string, field: "name" | "desc", value: string) {
    setDef((d) => (d ? { ...d, indices: { ...d.indices, [id]: { ...d.indices[id], [field]: value } } } : d));
  }

  function addIndex() {
    setDef((d) => {
      if (!d) return d;
      const id = uniqueId("endeks", new Set(Object.keys(d.indices)));
      const idx: IndexDef = { id, name: "Yeni Endeks", desc: "" };
      return { ...d, indices: { ...d.indices, [id]: idx } };
    });
  }

  function removeIndex(id: string) {
    if (!def) return;
    setError(null);
    const usedBy = dimensionEntries.filter(([, dim]) => dim.index === id);
    if (usedBy.length) {
      setError(`Bu endeksi silmeden önce ona bağlı ${usedBy.length} boyutu başka bir endekse taşı.`);
      return;
    }
    setDef((d) => {
      if (!d) return d;
      const indices = { ...d.indices };
      delete indices[id];
      return { ...d, indices };
    });
  }

  function updateDimension<K extends keyof Dimension>(id: string, field: K, value: Dimension[K]) {
    setDef((d) => (d ? { ...d, dimensions: { ...d.dimensions, [id]: { ...d.dimensions[id], [field]: value } } } : d));
  }

  function updateDimensionBand(id: string, band: Band, text: string) {
    setDef((d) =>
      d
        ? {
            ...d,
            dimensions: {
              ...d.dimensions,
              [id]: { ...d.dimensions[id], interpretation: { ...d.dimensions[id].interpretation, [band]: text } },
            },
          }
        : d,
    );
  }

  function addDimension() {
    setDef((d) => {
      if (!d) return d;
      const id = uniqueId("boyut", new Set(Object.keys(d.dimensions)));
      const firstIndex = Object.keys(d.indices)[0] ?? "";
      const dim: Dimension = {
        id,
        name: "Yeni Boyut",
        short: "",
        index: firstIndex,
        interpretation: { yüksek: "", orta: "", düşük: "" },
      };
      return { ...d, dimensions: { ...d.dimensions, [id]: dim } };
    });
  }

  function removeDimension(id: string) {
    if (!def) return;
    setError(null);
    const usedBy = def.questions.filter((q) => q.dim === id);
    if (usedBy.length) {
      setError(`Bu boyutu silmeden önce ona bağlı ${usedBy.length} soruyu başka bir boyuta taşı ya da sil.`);
      return;
    }
    setDef((d) => {
      if (!d) return d;
      const dimensions = { ...d.dimensions };
      delete dimensions[id];
      return { ...d, dimensions };
    });
  }

  function updateContextQuestion<K extends keyof ContextQuestion>(id: string, field: K, value: ContextQuestion[K]) {
    setDef((d) =>
      d
        ? { ...d, contextQuestions: (d.contextQuestions ?? []).map((cq) => (cq.id === id ? { ...cq, [field]: value } : cq)) }
        : d,
    );
  }

  function addContextQuestion() {
    setDef((d) => {
      if (!d) return d;
      const existing = new Set((d.contextQuestions ?? []).map((cq) => cq.id));
      const id = uniqueId("baglam", existing);
      const cq: ContextQuestion = { id, text: "", options: [{ label: "Seçenek 1", value: "a" }, { label: "Seçenek 2", value: "b" }] };
      return { ...d, contextQuestions: [...(d.contextQuestions ?? []), cq] };
    });
  }

  function removeContextQuestion(id: string) {
    setDef((d) => (d ? { ...d, contextQuestions: (d.contextQuestions ?? []).filter((cq) => cq.id !== id) } : d));
  }

  function updateContextOption(cqId: string, optionIndex: number, field: "label" | "value", value: string) {
    setDef((d) =>
      d
        ? {
            ...d,
            contextQuestions: (d.contextQuestions ?? []).map((cq) =>
              cq.id === cqId
                ? { ...cq, options: cq.options.map((o, i) => (i === optionIndex ? { ...o, [field]: value } : o)) }
                : cq,
            ),
          }
        : d,
    );
  }

  function addContextOption(cqId: string) {
    setDef((d) =>
      d
        ? {
            ...d,
            contextQuestions: (d.contextQuestions ?? []).map((cq) =>
              cq.id === cqId ? { ...cq, options: [...cq.options, { label: "Yeni seçenek", value: `v${cq.options.length + 1}` }] } : cq,
            ),
          }
        : d,
    );
  }

  function removeContextOption(cqId: string, optionIndex: number) {
    setDef((d) =>
      d
        ? {
            ...d,
            contextQuestions: (d.contextQuestions ?? []).map((cq) =>
              cq.id === cqId ? { ...cq, options: cq.options.filter((_, i) => i !== optionIndex) } : cq,
            ),
          }
        : d,
    );
  }

  function updateConditionalNote(dimId: string, index: number, field: keyof ConditionalNote, value: string) {
    setDef((d) =>
      d
        ? {
            ...d,
            dimensions: {
              ...d.dimensions,
              [dimId]: {
                ...d.dimensions[dimId],
                conditionalNotes: (d.dimensions[dimId].conditionalNotes ?? []).map((n, i) =>
                  i === index ? { ...n, [field]: value } : n,
                ),
              },
            },
          }
        : d,
    );
  }

  function addConditionalNote(dimId: string) {
    setDef((d) => {
      if (!d) return d;
      const firstCq = contextQuestions[0];
      const note: ConditionalNote = {
        contextQuestionId: firstCq?.id ?? "",
        whenValue: firstCq?.options[0]?.value ?? "",
        band: "düşük",
        note: "",
      };
      return {
        ...d,
        dimensions: {
          ...d.dimensions,
          [dimId]: { ...d.dimensions[dimId], conditionalNotes: [...(d.dimensions[dimId].conditionalNotes ?? []), note] },
        },
      };
    });
  }

  function removeConditionalNote(dimId: string, index: number) {
    setDef((d) =>
      d
        ? {
            ...d,
            dimensions: {
              ...d.dimensions,
              [dimId]: {
                ...d.dimensions[dimId],
                conditionalNotes: (d.dimensions[dimId].conditionalNotes ?? []).filter((_, i) => i !== index),
              },
            },
          }
        : d,
    );
  }

  function updateQuestionRoleText(questionId: number, roleValue: string, text: string) {
    setDef((d) =>
      d
        ? {
            ...d,
            questions: d.questions.map((q) => {
              if (q.id !== questionId) return q;
              const textByRole = { ...(q.textByRole ?? {}) };
              if (text.trim()) textByRole[roleValue] = text;
              else delete textByRole[roleValue];
              return { ...q, textByRole: Object.keys(textByRole).length ? textByRole : undefined };
            }),
          }
        : d,
    );
  }

  function updateQuestion<K extends keyof Question>(id: number, field: K, value: Question[K]) {
    setDef((d) => (d ? { ...d, questions: d.questions.map((q) => (q.id === id ? { ...q, [field]: value } : q)) } : d));
  }

  function updateOptionLabel(questionId: number, optionIndex: number, label: string) {
    setDef((d) =>
      d
        ? {
            ...d,
            questions: d.questions.map((q) =>
              q.id === questionId
                ? { ...q, options: q.options.map((o, i) => (i === optionIndex ? { ...o, label } : o)) }
                : q,
            ),
          }
        : d,
    );
  }

  function addQuestion() {
    setDef((d) => {
      if (!d) return d;
      const nextId = d.questions.length ? Math.max(...d.questions.map((q) => q.id)) + 1 : 0;
      const firstDim = Object.keys(d.dimensions)[0] ?? "";
      const q: Question = {
        id: nextId,
        dim: firstDim,
        type: "likert",
        text: "",
        options: OPTION_SETS.likert.map((o) => ({ ...o })),
      };
      return { ...d, questions: [...d.questions, q] };
    });
  }

  function changeQuestionType(id: number, type: Question["type"]) {
    setDef((d) =>
      d
        ? {
            ...d,
            questions: d.questions.map((q) =>
              q.id === id ? { ...q, type, options: OPTION_SETS[type].map((o) => ({ ...o })) } : q,
            ),
          }
        : d,
    );
  }

  function removeQuestion(id: number) {
    setDef((d) => (d ? { ...d, questions: d.questions.filter((q) => q.id !== id) } : d));
  }

  async function handleSave() {
    if (!def || !testId) return;
    setError(null);
    setSaving(true);
    setSaved(false);
    try {
      const updated = await updateAdminTest(testId, def);
      setDef(updated);
      setOriginalQuestionIds(new Set(updated.questions.map((q) => q.id)));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Kaydedilemedi. Alanları kontrol edip tekrar dene.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="wrap admin-wrap">
      <AdminNav />
      <div className="admin-test-edit-head">
        <h1>{def.name}</h1>
        <button type="button" className="btn" onClick={handleSave} disabled={saving}>
          {saving ? "Kaydediliyor…" : saved ? "Kaydedildi!" : "Kaydet"}
        </button>
      </div>
      {error && <p className="admin-error">{error}</p>}

      <h2>Genel</h2>
      <div className="card admin-form">
        <label className="admin-field">
          <span>Ad</span>
          <input className="admin-input" value={def.name} onChange={(e) => updateMeta("name", e.target.value)} />
        </label>
        <label className="admin-field">
          <span>Alt başlık</span>
          <input className="admin-input" value={def.subtitle} onChange={(e) => updateMeta("subtitle", e.target.value)} />
        </label>
        <label className="admin-field">
          <span>Davet metni</span>
          <input className="admin-input" value={def.inviteCta} onChange={(e) => updateMeta("inviteCta", e.target.value)} />
        </label>
        <label className="admin-field">
          <span>Sorumluluk reddi notu (opsiyonel)</span>
          <textarea
            className="admin-input"
            rows={2}
            value={def.disclaimerNote ?? ""}
            onChange={(e) => updateMeta("disclaimerNote", e.target.value || undefined)}
          />
        </label>
      </div>

      <h2>Bağlam Soruları</h2>
      <p className="small muted">Cevaplayanın rolüne (ör. ebeveyn/çocuk, yönetici/çalışan) göre soru metnini değiştirmek ya da boyut yorumuna koşullu not eklemek için kullanılır.</p>
      {contextQuestions.map((cq) => (
        <div className="card admin-array-row" key={cq.id}>
          <div className="admin-array-row-head">
            <span className="small muted">id: {cq.id}</span>
            <button type="button" className="admin-remove-btn" onClick={() => removeContextQuestion(cq.id)}>
              Sil
            </button>
          </div>
          <label className="admin-field">
            <span>Soru metni</span>
            <input className="admin-input" value={cq.text} onChange={(e) => updateContextQuestion(cq.id, "text", e.target.value)} />
          </label>
          <div className="admin-field">
            <span>Seçenekler</span>
            {cq.options.map((opt, i) => (
              <div className="admin-option-row" key={i}>
                <input
                  className="admin-input"
                  placeholder="Etiket"
                  value={opt.label}
                  onChange={(e) => updateContextOption(cq.id, i, "label", e.target.value)}
                />
                <input
                  className="admin-input"
                  placeholder="Değer"
                  value={opt.value}
                  onChange={(e) => updateContextOption(cq.id, i, "value", e.target.value)}
                />
                <button type="button" className="admin-remove-btn" onClick={() => removeContextOption(cq.id, i)}>
                  Sil
                </button>
              </div>
            ))}
            <button type="button" className="btn secondary admin-array-add" onClick={() => addContextOption(cq.id)}>
              + Seçenek ekle
            </button>
          </div>
        </div>
      ))}
      <button type="button" className="btn secondary admin-array-add" onClick={addContextQuestion}>
        + Bağlam sorusu ekle
      </button>

      <h2>Endeksler</h2>
      {indexEntries.map(([id, idx]) => (
        <div className="card admin-array-row" key={id}>
          <div className="admin-array-row-head">
            <span className="small muted">id: {id}</span>
            <button type="button" className="admin-remove-btn" onClick={() => removeIndex(id)}>
              Sil
            </button>
          </div>
          <label className="admin-field">
            <span>Ad</span>
            <input className="admin-input" value={idx.name} onChange={(e) => updateIndex(id, "name", e.target.value)} />
          </label>
          <label className="admin-field">
            <span>Açıklama</span>
            <input className="admin-input" value={idx.desc} onChange={(e) => updateIndex(id, "desc", e.target.value)} />
          </label>
        </div>
      ))}
      <button type="button" className="btn secondary admin-array-add" onClick={addIndex}>
        + Endeks ekle
      </button>

      <h2>Boyutlar</h2>
      {dimensionEntries.map(([id, dim]) => (
        <div className="card admin-array-row" key={id}>
          <div className="admin-array-row-head">
            <span className="small muted">id: {id}</span>
            <button type="button" className="admin-remove-btn" onClick={() => removeDimension(id)}>
              Sil
            </button>
          </div>
          <label className="admin-field">
            <span>Ad</span>
            <input className="admin-input" value={dim.name} onChange={(e) => updateDimension(id, "name", e.target.value)} />
          </label>
          <label className="admin-field">
            <span>Kısa açıklama</span>
            <input className="admin-input" value={dim.short} onChange={(e) => updateDimension(id, "short", e.target.value)} />
          </label>
          <label className="admin-field">
            <span>Endeks</span>
            <select className="admin-input" value={dim.index} onChange={(e) => updateDimension(id, "index", e.target.value)}>
              {indexEntries.map(([idxId, idx]) => (
                <option key={idxId} value={idxId}>
                  {idx.name}
                </option>
              ))}
            </select>
          </label>
          {BANDS.map((band) => (
            <label className="admin-field" key={band}>
              <span>Yorum — {BAND_LABEL[band]}</span>
              <textarea
                className="admin-input"
                rows={2}
                value={dim.interpretation[band]}
                onChange={(e) => updateDimensionBand(id, band, e.target.value)}
              />
            </label>
          ))}
          <div className="admin-field">
            <span>Koşullu notlar (opsiyonel — bağlam cevabına göre bu boyutun yorumuna eklenir)</span>
            {(dim.conditionalNotes ?? []).map((note, i) => (
              <div className="admin-array-row" key={i}>
                <div className="admin-filters">
                  <label className="admin-field admin-field-inline">
                    <span>Bağlam sorusu</span>
                    <select
                      className="admin-input"
                      value={note.contextQuestionId}
                      onChange={(e) => updateConditionalNote(id, i, "contextQuestionId", e.target.value)}
                    >
                      {contextQuestions.map((cq) => (
                        <option key={cq.id} value={cq.id}>
                          {cq.text || cq.id}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="admin-field admin-field-inline">
                    <span>Değer</span>
                    <select
                      className="admin-input"
                      value={note.whenValue}
                      onChange={(e) => updateConditionalNote(id, i, "whenValue", e.target.value)}
                    >
                      {(contextQuestions.find((cq) => cq.id === note.contextQuestionId)?.options ?? []).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="admin-field admin-field-inline">
                    <span>Bant</span>
                    <select className="admin-input" value={note.band} onChange={(e) => updateConditionalNote(id, i, "band", e.target.value)}>
                      {BANDS.map((band) => (
                        <option key={band} value={band}>
                          {BAND_LABEL[band]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <textarea
                  className="admin-input"
                  rows={2}
                  value={note.note}
                  onChange={(e) => updateConditionalNote(id, i, "note", e.target.value)}
                />
                <button type="button" className="admin-remove-btn" onClick={() => removeConditionalNote(id, i)}>
                  Sil
                </button>
              </div>
            ))}
            <button type="button" className="btn secondary admin-array-add" onClick={() => addConditionalNote(id)}>
              + Koşullu not ekle
            </button>
          </div>
        </div>
      ))}
      <button type="button" className="btn secondary admin-array-add" onClick={addDimension}>
        + Boyut ekle
      </button>

      <h2>Sorular ({def.questions.length})</h2>
      {def.questions.map((q) => {
        const isNew = !originalQuestionIds.has(q.id);
        return (
          <div className="card admin-array-row" key={q.id}>
            <div className="admin-array-row-head">
              <span className="small muted">id: {q.id}</span>
              <button type="button" className="admin-remove-btn" onClick={() => removeQuestion(q.id)}>
                Sil
              </button>
            </div>
            <label className="admin-field">
              <span>Soru metni</span>
              <textarea
                className="admin-input"
                rows={2}
                value={q.text}
                onChange={(e) => updateQuestion(q.id, "text", e.target.value)}
              />
            </label>
            {contextQuestions.length > 0 && (
              <div className="admin-field">
                <span>Role göre metin (boş bırakılırsa yukarıdaki metin kullanılır)</span>
                {contextQuestions.flatMap((cq) =>
                  cq.options.map((opt) => (
                    <label className="admin-field" key={`${cq.id}:${opt.value}`}>
                      <span className="small muted">{opt.label}</span>
                      <textarea
                        className="admin-input"
                        rows={2}
                        value={q.textByRole?.[opt.value] ?? ""}
                        onChange={(e) => updateQuestionRoleText(q.id, opt.value, e.target.value)}
                      />
                    </label>
                  )),
                )}
              </div>
            )}
            <div className="admin-filters">
              <label className="admin-field admin-field-inline">
                <span>Boyut</span>
                <select className="admin-input" value={q.dim} onChange={(e) => updateQuestion(q.id, "dim", e.target.value)}>
                  {dimensionEntries.map(([dimId, dim]) => (
                    <option key={dimId} value={dimId}>
                      {dim.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-field admin-field-inline">
                <span>Tip</span>
                {isNew ? (
                  <select
                    className="admin-input"
                    value={q.type}
                    onChange={(e) => changeQuestionType(q.id, e.target.value as Question["type"])}
                  >
                    {QUESTION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="small muted">{q.type}</span>
                )}
              </label>
              <label className="admin-field admin-field-inline">
                <span>Memnuniyet sorusu</span>
                <input
                  type="checkbox"
                  checked={!!q.satisfactionQuestion}
                  onChange={(e) => updateQuestion(q.id, "satisfactionQuestion", e.target.checked)}
                />
              </label>
            </div>
            <div className="admin-field">
              <span>Seçenekler (puanlar sabit, yalnızca etiket düzenlenebilir)</span>
              {q.options.map((opt, i) => (
                <div className="admin-option-row" key={i}>
                  <input
                    className="admin-input"
                    value={opt.label}
                    onChange={(e) => updateOptionLabel(q.id, i, e.target.value)}
                  />
                  <span className="small muted admin-option-score">{opt.score}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <button type="button" className="btn secondary admin-array-add" onClick={addQuestion}>
        + Soru ekle
      </button>
    </main>
  );
}

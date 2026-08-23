import { memo, useEffect, useMemo, useReducer, useState, type Dispatch } from "react";
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

/* Tek büyük component + inline closure'lar yerine reducer: dispatch referansı
   sabit kalır, değişmeyen questions/dimensions girdileri aynı obje referansını
   korur (immutable update). Bu ikisi olmadan React.memo alt kartlarda işe
   yaramaz — her tuş vuruşu 40+ kartın tamamını yeniden render eder. */
interface State {
  def: TestDefinition | null;
  error: string | null;
}

type Action =
  | { type: "SET_DEF"; def: TestDefinition }
  | { type: "SET_ERROR"; message: string | null }
  | { type: "SET_META"; key: "name" | "subtitle" | "inviteCta" | "disclaimerNote"; value: string | undefined }
  | { type: "SET_INDEX"; id: string; field: "name" | "desc"; value: string }
  | { type: "ADD_INDEX" }
  | { type: "REMOVE_INDEX"; id: string }
  | { type: "SET_DIMENSION"; id: string; field: "name" | "short" | "index"; value: string }
  | { type: "SET_DIMENSION_BAND"; id: string; band: Band; text: string }
  | { type: "ADD_DIMENSION" }
  | { type: "REMOVE_DIMENSION"; id: string }
  | { type: "SET_CONTEXT_QUESTION"; id: string; field: "id" | "text"; value: string }
  | { type: "ADD_CONTEXT_QUESTION" }
  | { type: "REMOVE_CONTEXT_QUESTION"; id: string }
  | { type: "SET_CONTEXT_OPTION"; cqId: string; index: number; field: "label" | "value"; value: string }
  | { type: "ADD_CONTEXT_OPTION"; cqId: string }
  | { type: "REMOVE_CONTEXT_OPTION"; cqId: string; index: number }
  | { type: "SET_CONDITIONAL_NOTE"; dimId: string; index: number; field: keyof ConditionalNote; value: string }
  | { type: "ADD_CONDITIONAL_NOTE"; dimId: string }
  | { type: "REMOVE_CONDITIONAL_NOTE"; dimId: string; index: number }
  | { type: "SET_QUESTION_ROLE_TEXT"; questionId: number; roleValue: string; text: string }
  | { type: "ADD_COMBINED_OVERRIDE"; questionId: number }
  | {
      type: "SET_COMBINED_OVERRIDE_VALUE";
      questionId: number;
      oldKey: string;
      cqId: string;
      newValue: string;
      currentValues: Record<string, string>;
    }
  | { type: "SET_COMBINED_OVERRIDE_TEXT"; questionId: number; key: string; text: string }
  | { type: "REMOVE_COMBINED_OVERRIDE"; questionId: number; key: string }
  | { type: "SET_QUESTION"; id: number; field: "text" | "dim"; value: string }
  | { type: "SET_QUESTION_SATISFACTION"; id: number; value: boolean }
  | { type: "SET_OPTION_LABEL"; questionId: number; index: number; label: string }
  | { type: "ADD_QUESTION" }
  | { type: "CHANGE_QUESTION_TYPE"; id: number; qtype: Question["type"] }
  | { type: "REMOVE_QUESTION"; id: number };

function reducer(state: State, action: Action): State {
  if (action.type === "SET_DEF") return { def: action.def, error: null };
  if (action.type === "SET_ERROR") return { ...state, error: action.message };

  const def = state.def;
  if (!def) return state;

  switch (action.type) {
    case "SET_META":
      return { ...state, def: { ...def, [action.key]: action.value } };

    case "SET_INDEX":
      return {
        ...state,
        def: { ...def, indices: { ...def.indices, [action.id]: { ...def.indices[action.id], [action.field]: action.value } } },
      };

    case "ADD_INDEX": {
      const id = uniqueId("endeks", new Set(Object.keys(def.indices)));
      const idx: IndexDef = { id, name: "Yeni Endeks", desc: "" };
      return { ...state, def: { ...def, indices: { ...def.indices, [id]: idx } } };
    }

    case "REMOVE_INDEX": {
      const usedBy = Object.values(def.dimensions).filter((dim) => dim.index === action.id);
      if (usedBy.length) {
        return { ...state, error: `Bu endeksi silmeden önce ona bağlı ${usedBy.length} boyutu başka bir endekse taşı.` };
      }
      const indices = { ...def.indices };
      delete indices[action.id];
      return { def: { ...def, indices }, error: null };
    }

    case "SET_DIMENSION":
      return {
        ...state,
        def: { ...def, dimensions: { ...def.dimensions, [action.id]: { ...def.dimensions[action.id], [action.field]: action.value } } },
      };

    case "SET_DIMENSION_BAND":
      return {
        ...state,
        def: {
          ...def,
          dimensions: {
            ...def.dimensions,
            [action.id]: {
              ...def.dimensions[action.id],
              interpretation: { ...def.dimensions[action.id].interpretation, [action.band]: action.text },
            },
          },
        },
      };

    case "ADD_DIMENSION": {
      const id = uniqueId("boyut", new Set(Object.keys(def.dimensions)));
      const firstIndex = Object.keys(def.indices)[0] ?? "";
      const dim: Dimension = { id, name: "Yeni Boyut", short: "", index: firstIndex, interpretation: { yüksek: "", orta: "", düşük: "" } };
      return { ...state, def: { ...def, dimensions: { ...def.dimensions, [id]: dim } } };
    }

    case "REMOVE_DIMENSION": {
      const usedBy = def.questions.filter((q) => q.dim === action.id);
      if (usedBy.length) {
        return { ...state, error: `Bu boyutu silmeden önce ona bağlı ${usedBy.length} soruyu başka bir boyuta taşı ya da sil.` };
      }
      const dimensions = { ...def.dimensions };
      delete dimensions[action.id];
      return { def: { ...def, dimensions }, error: null };
    }

    case "SET_CONTEXT_QUESTION":
      return {
        ...state,
        def: { ...def, contextQuestions: (def.contextQuestions ?? []).map((cq) => (cq.id === action.id ? { ...cq, [action.field]: action.value } : cq)) },
      };

    case "ADD_CONTEXT_QUESTION": {
      const existing = new Set((def.contextQuestions ?? []).map((cq) => cq.id));
      const id = uniqueId("baglam", existing);
      const cq: ContextQuestion = { id, text: "", options: [{ label: "Seçenek 1", value: "a" }, { label: "Seçenek 2", value: "b" }] };
      return { ...state, def: { ...def, contextQuestions: [...(def.contextQuestions ?? []), cq] } };
    }

    case "REMOVE_CONTEXT_QUESTION":
      return { ...state, def: { ...def, contextQuestions: (def.contextQuestions ?? []).filter((cq) => cq.id !== action.id) } };

    case "SET_CONTEXT_OPTION":
      return {
        ...state,
        def: {
          ...def,
          contextQuestions: (def.contextQuestions ?? []).map((cq) =>
            cq.id === action.cqId ? { ...cq, options: cq.options.map((o, i) => (i === action.index ? { ...o, [action.field]: action.value } : o)) } : cq,
          ),
        },
      };

    case "ADD_CONTEXT_OPTION":
      return {
        ...state,
        def: {
          ...def,
          contextQuestions: (def.contextQuestions ?? []).map((cq) =>
            cq.id === action.cqId ? { ...cq, options: [...cq.options, { label: "Yeni seçenek", value: `v${cq.options.length + 1}` }] } : cq,
          ),
        },
      };

    case "REMOVE_CONTEXT_OPTION":
      return {
        ...state,
        def: {
          ...def,
          contextQuestions: (def.contextQuestions ?? []).map((cq) =>
            cq.id === action.cqId ? { ...cq, options: cq.options.filter((_, i) => i !== action.index) } : cq,
          ),
        },
      };

    case "SET_CONDITIONAL_NOTE":
      return {
        ...state,
        def: {
          ...def,
          dimensions: {
            ...def.dimensions,
            [action.dimId]: {
              ...def.dimensions[action.dimId],
              conditionalNotes: (def.dimensions[action.dimId].conditionalNotes ?? []).map((n, i) =>
                i === action.index ? { ...n, [action.field]: action.value } : n,
              ),
            },
          },
        },
      };

    case "ADD_CONDITIONAL_NOTE": {
      const firstCq = (def.contextQuestions ?? [])[0];
      const note: ConditionalNote = { contextQuestionId: firstCq?.id ?? "", whenValue: firstCq?.options[0]?.value ?? "", band: "düşük", note: "" };
      return {
        ...state,
        def: {
          ...def,
          dimensions: {
            ...def.dimensions,
            [action.dimId]: { ...def.dimensions[action.dimId], conditionalNotes: [...(def.dimensions[action.dimId].conditionalNotes ?? []), note] },
          },
        },
      };
    }

    case "REMOVE_CONDITIONAL_NOTE":
      return {
        ...state,
        def: {
          ...def,
          dimensions: {
            ...def.dimensions,
            [action.dimId]: {
              ...def.dimensions[action.dimId],
              conditionalNotes: (def.dimensions[action.dimId].conditionalNotes ?? []).filter((_, i) => i !== action.index),
            },
          },
        },
      };

    case "SET_QUESTION_ROLE_TEXT":
      return {
        ...state,
        def: {
          ...def,
          questions: def.questions.map((q) => {
            if (q.id !== action.questionId) return q;
            const textByRole = { ...(q.textByRole ?? {}) };
            if (action.text.trim()) textByRole[action.roleValue] = action.text;
            else delete textByRole[action.roleValue];
            return { ...q, textByRole: Object.keys(textByRole).length ? textByRole : undefined };
          }),
        },
      };

    case "ADD_COMBINED_OVERRIDE": {
      const cqs = def.contextQuestions ?? [];
      const values: Record<string, string> = {};
      cqs.forEach((cq) => {
        values[cq.id] = cq.options[0]?.value ?? "";
      });
      const key = cqs.map((cq) => values[cq.id]).join(":");
      return {
        ...state,
        def: {
          ...def,
          questions: def.questions.map((q) => {
            if (q.id !== action.questionId) return q;
            const textByRole = { ...(q.textByRole ?? {}) };
            if (!(key in textByRole)) textByRole[key] = "";
            return { ...q, textByRole };
          }),
        },
      };
    }

    case "SET_COMBINED_OVERRIDE_VALUE": {
      const cqs = def.contextQuestions ?? [];
      const values = { ...action.currentValues, [action.cqId]: action.newValue };
      const newKey = cqs.map((cq) => values[cq.id]).join(":");
      return {
        ...state,
        def: {
          ...def,
          questions: def.questions.map((q) => {
            if (q.id !== action.questionId) return q;
            const textByRole = { ...(q.textByRole ?? {}) };
            const text = textByRole[action.oldKey] ?? "";
            delete textByRole[action.oldKey];
            textByRole[newKey] = text;
            return { ...q, textByRole };
          }),
        },
      };
    }

    case "SET_COMBINED_OVERRIDE_TEXT":
      return {
        ...state,
        def: {
          ...def,
          questions: def.questions.map((q) => (q.id === action.questionId ? { ...q, textByRole: { ...(q.textByRole ?? {}), [action.key]: action.text } } : q)),
        },
      };

    case "REMOVE_COMBINED_OVERRIDE":
      return {
        ...state,
        def: {
          ...def,
          questions: def.questions.map((q) => {
            if (q.id !== action.questionId) return q;
            const textByRole = { ...(q.textByRole ?? {}) };
            delete textByRole[action.key];
            return { ...q, textByRole: Object.keys(textByRole).length ? textByRole : undefined };
          }),
        },
      };

    case "SET_QUESTION":
      return { ...state, def: { ...def, questions: def.questions.map((q) => (q.id === action.id ? { ...q, [action.field]: action.value } : q)) } };

    case "SET_QUESTION_SATISFACTION":
      return {
        ...state,
        def: { ...def, questions: def.questions.map((q) => (q.id === action.id ? { ...q, satisfactionQuestion: action.value } : q)) },
      };

    case "SET_OPTION_LABEL":
      return {
        ...state,
        def: {
          ...def,
          questions: def.questions.map((q) =>
            q.id === action.questionId ? { ...q, options: q.options.map((o, i) => (i === action.index ? { ...o, label: action.label } : o)) } : q,
          ),
        },
      };

    case "ADD_QUESTION": {
      const nextId = def.questions.length ? Math.max(...def.questions.map((q) => q.id)) + 1 : 0;
      const firstDim = Object.keys(def.dimensions)[0] ?? "";
      const q: Question = { id: nextId, dim: firstDim, type: "likert", text: "", options: OPTION_SETS.likert.map((o) => ({ ...o })) };
      return { ...state, def: { ...def, questions: [...def.questions, q] } };
    }

    case "CHANGE_QUESTION_TYPE":
      return {
        ...state,
        def: {
          ...def,
          questions: def.questions.map((q) => (q.id === action.id ? { ...q, type: action.qtype, options: OPTION_SETS[action.qtype].map((o) => ({ ...o })) } : q)),
        },
      };

    case "REMOVE_QUESTION":
      return { ...state, def: { ...def, questions: def.questions.filter((q) => q.id !== action.id) } };

    default:
      return state;
  }
}

const IndexRow = memo(function IndexRow({ id, idx, dispatch }: { id: string; idx: IndexDef; dispatch: Dispatch<Action> }) {
  return (
    <div className="card admin-array-row">
      <div className="admin-array-row-head">
        <span className="small muted">id: {id}</span>
        <button type="button" className="admin-remove-btn" onClick={() => dispatch({ type: "REMOVE_INDEX", id })}>
          Sil
        </button>
      </div>
      <label className="admin-field">
        <span>Ad</span>
        <input className="admin-input" value={idx.name} onChange={(e) => dispatch({ type: "SET_INDEX", id, field: "name", value: e.target.value })} />
      </label>
      <label className="admin-field">
        <span>Açıklama</span>
        <input className="admin-input" value={idx.desc} onChange={(e) => dispatch({ type: "SET_INDEX", id, field: "desc", value: e.target.value })} />
      </label>
    </div>
  );
});

const ContextQuestionRow = memo(function ContextQuestionRow({ cq, dispatch }: { cq: ContextQuestion; dispatch: Dispatch<Action> }) {
  return (
    <div className="card admin-array-row">
      <div className="admin-array-row-head">
        <span className="small muted">id: {cq.id}</span>
        <button type="button" className="admin-remove-btn" onClick={() => dispatch({ type: "REMOVE_CONTEXT_QUESTION", id: cq.id })}>
          Sil
        </button>
      </div>
      <label className="admin-field">
        <span>Soru metni</span>
        <input
          className="admin-input"
          value={cq.text}
          onChange={(e) => dispatch({ type: "SET_CONTEXT_QUESTION", id: cq.id, field: "text", value: e.target.value })}
        />
      </label>
      <div className="admin-field">
        <span>Seçenekler</span>
        {cq.options.map((opt, i) => (
          <div className="admin-option-row" key={i}>
            <input
              className="admin-input"
              placeholder="Etiket"
              value={opt.label}
              onChange={(e) => dispatch({ type: "SET_CONTEXT_OPTION", cqId: cq.id, index: i, field: "label", value: e.target.value })}
            />
            <input
              className="admin-input"
              placeholder="Değer"
              value={opt.value}
              onChange={(e) => dispatch({ type: "SET_CONTEXT_OPTION", cqId: cq.id, index: i, field: "value", value: e.target.value })}
            />
            <button type="button" className="admin-remove-btn" onClick={() => dispatch({ type: "REMOVE_CONTEXT_OPTION", cqId: cq.id, index: i })}>
              Sil
            </button>
          </div>
        ))}
        <button type="button" className="btn secondary admin-array-add" onClick={() => dispatch({ type: "ADD_CONTEXT_OPTION", cqId: cq.id })}>
          + Seçenek ekle
        </button>
      </div>
    </div>
  );
});

const DimensionCard = memo(function DimensionCard({
  id,
  dim,
  indexEntries,
  contextQuestions,
  dispatch,
}: {
  id: string;
  dim: Dimension;
  indexEntries: [string, IndexDef][];
  contextQuestions: ContextQuestion[];
  dispatch: Dispatch<Action>;
}) {
  return (
    <div className="card admin-array-row">
      <div className="admin-array-row-head">
        <span className="small muted">id: {id}</span>
        <button type="button" className="admin-remove-btn" onClick={() => dispatch({ type: "REMOVE_DIMENSION", id })}>
          Sil
        </button>
      </div>
      <label className="admin-field">
        <span>Ad</span>
        <input className="admin-input" value={dim.name} onChange={(e) => dispatch({ type: "SET_DIMENSION", id, field: "name", value: e.target.value })} />
      </label>
      <label className="admin-field">
        <span>Kısa açıklama</span>
        <input className="admin-input" value={dim.short} onChange={(e) => dispatch({ type: "SET_DIMENSION", id, field: "short", value: e.target.value })} />
      </label>
      <label className="admin-field">
        <span>Endeks</span>
        <select className="admin-input" value={dim.index} onChange={(e) => dispatch({ type: "SET_DIMENSION", id, field: "index", value: e.target.value })}>
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
            onChange={(e) => dispatch({ type: "SET_DIMENSION_BAND", id, band, text: e.target.value })}
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
                  onChange={(e) => dispatch({ type: "SET_CONDITIONAL_NOTE", dimId: id, index: i, field: "contextQuestionId", value: e.target.value })}
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
                  onChange={(e) => dispatch({ type: "SET_CONDITIONAL_NOTE", dimId: id, index: i, field: "whenValue", value: e.target.value })}
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
                <select
                  className="admin-input"
                  value={note.band}
                  onChange={(e) => dispatch({ type: "SET_CONDITIONAL_NOTE", dimId: id, index: i, field: "band", value: e.target.value })}
                >
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
              onChange={(e) => dispatch({ type: "SET_CONDITIONAL_NOTE", dimId: id, index: i, field: "note", value: e.target.value })}
            />
            <button type="button" className="admin-remove-btn" onClick={() => dispatch({ type: "REMOVE_CONDITIONAL_NOTE", dimId: id, index: i })}>
              Sil
            </button>
          </div>
        ))}
        <button type="button" className="btn secondary admin-array-add" onClick={() => dispatch({ type: "ADD_CONDITIONAL_NOTE", dimId: id })}>
          + Koşullu not ekle
        </button>
      </div>
    </div>
  );
});

const QuestionCard = memo(function QuestionCard({
  q,
  isNew,
  dimensionEntries,
  contextQuestions,
  dispatch,
}: {
  q: Question;
  isNew: boolean;
  dimensionEntries: [string, Dimension][];
  contextQuestions: ContextQuestion[];
  dispatch: Dispatch<Action>;
}) {
  return (
    <div className="card admin-array-row">
      <div className="admin-array-row-head">
        <span className="small muted">id: {q.id}</span>
        <button type="button" className="admin-remove-btn" onClick={() => dispatch({ type: "REMOVE_QUESTION", id: q.id })}>
          Sil
        </button>
      </div>
      <label className="admin-field">
        <span>Soru metni</span>
        <textarea
          className="admin-input"
          rows={2}
          value={q.text}
          onChange={(e) => dispatch({ type: "SET_QUESTION", id: q.id, field: "text", value: e.target.value })}
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
                  onChange={(e) => dispatch({ type: "SET_QUESTION_ROLE_TEXT", questionId: q.id, roleValue: opt.value, text: e.target.value })}
                />
              </label>
            )),
          )}
        </div>
      )}
      {contextQuestions.length >= 2 && (
        <div className="admin-field">
          <span>Bileşik geçersiz kılmalar (opsiyonel — ör. role + yaş birlikte)</span>
          {Object.entries(q.textByRole ?? {})
            .filter(([key]) => key.includes(":"))
            .map(([key, text]) => {
              const parts = key.split(":");
              const values: Record<string, string> = {};
              contextQuestions.forEach((cq, idx) => {
                if (parts[idx] != null) values[cq.id] = parts[idx];
              });
              return (
                <div className="admin-array-row" key={key}>
                  <div className="admin-filters">
                    {contextQuestions.map((cq) => (
                      <label className="admin-field admin-field-inline" key={cq.id}>
                        <span className="small muted">{cq.text || cq.id}</span>
                        <select
                          className="admin-input"
                          value={values[cq.id] ?? ""}
                          onChange={(e) =>
                            dispatch({
                              type: "SET_COMBINED_OVERRIDE_VALUE",
                              questionId: q.id,
                              oldKey: key,
                              cqId: cq.id,
                              newValue: e.target.value,
                              currentValues: values,
                            })
                          }
                        >
                          {cq.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                  <textarea
                    className="admin-input"
                    rows={2}
                    value={text}
                    onChange={(e) => dispatch({ type: "SET_COMBINED_OVERRIDE_TEXT", questionId: q.id, key, text: e.target.value })}
                  />
                  <button type="button" className="admin-remove-btn" onClick={() => dispatch({ type: "REMOVE_COMBINED_OVERRIDE", questionId: q.id, key })}>
                    Sil
                  </button>
                </div>
              );
            })}
          <button type="button" className="btn secondary admin-array-add" onClick={() => dispatch({ type: "ADD_COMBINED_OVERRIDE", questionId: q.id })}>
            + Bileşik geçersiz kılma ekle
          </button>
        </div>
      )}
      <div className="admin-filters">
        <label className="admin-field admin-field-inline">
          <span>Boyut</span>
          <select className="admin-input" value={q.dim} onChange={(e) => dispatch({ type: "SET_QUESTION", id: q.id, field: "dim", value: e.target.value })}>
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
              onChange={(e) => dispatch({ type: "CHANGE_QUESTION_TYPE", id: q.id, qtype: e.target.value as Question["type"] })}
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
            onChange={(e) => dispatch({ type: "SET_QUESTION_SATISFACTION", id: q.id, value: e.target.checked })}
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
              onChange={(e) => dispatch({ type: "SET_OPTION_LABEL", questionId: q.id, index: i, label: e.target.value })}
            />
            <span className="small muted admin-option-score">{opt.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

export function AdminTestEditPage() {
  const { testId } = useParams<{ testId: string }>();
  const [state, dispatch] = useReducer(reducer, { def: null, error: null });
  const { def, error } = state;
  const [originalQuestionIds, setOriginalQuestionIds] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!testId) return;
    fetchTest(testId).then((t) => {
      dispatch({ type: "SET_DEF", def: t });
      setOriginalQuestionIds(new Set(t.questions.map((q) => q.id)));
    });
  }, [testId]);

  const indexEntries = useMemo(() => (def ? Object.entries(def.indices) : []), [def?.indices]);
  const dimensionEntries = useMemo(() => (def ? Object.entries(def.dimensions) : []), [def?.dimensions]);
  const contextQuestions = useMemo(() => def?.contextQuestions ?? [], [def?.contextQuestions]);

  if (!def) {
    return (
      <main className="wrap admin-wrap">
        <AdminNav />
        <p className="muted small">Yükleniyor…</p>
      </main>
    );
  }

  async function handleSave() {
    if (!def || !testId) return;
    dispatch({ type: "SET_ERROR", message: null });
    setSaving(true);
    setSaved(false);
    try {
      const updated = await updateAdminTest(testId, def);
      dispatch({ type: "SET_DEF", def: updated });
      setOriginalQuestionIds(new Set(updated.questions.map((q) => q.id)));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      dispatch({ type: "SET_ERROR", message: "Kaydedilemedi. Alanları kontrol edip tekrar dene." });
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
          <input className="admin-input" value={def.name} onChange={(e) => dispatch({ type: "SET_META", key: "name", value: e.target.value })} />
        </label>
        <label className="admin-field">
          <span>Alt başlık</span>
          <input className="admin-input" value={def.subtitle} onChange={(e) => dispatch({ type: "SET_META", key: "subtitle", value: e.target.value })} />
        </label>
        <label className="admin-field">
          <span>Davet metni</span>
          <input className="admin-input" value={def.inviteCta} onChange={(e) => dispatch({ type: "SET_META", key: "inviteCta", value: e.target.value })} />
        </label>
        <label className="admin-field">
          <span>Sorumluluk reddi notu (opsiyonel)</span>
          <textarea
            className="admin-input"
            rows={2}
            value={def.disclaimerNote ?? ""}
            onChange={(e) => dispatch({ type: "SET_META", key: "disclaimerNote", value: e.target.value || undefined })}
          />
        </label>
      </div>

      <h2>Bağlam Soruları</h2>
      <p className="small muted">Cevaplayanın rolüne (ör. ebeveyn/çocuk, yönetici/çalışan) göre soru metnini değiştirmek ya da boyut yorumuna koşullu not eklemek için kullanılır.</p>
      {contextQuestions.map((cq) => (
        <ContextQuestionRow key={cq.id} cq={cq} dispatch={dispatch} />
      ))}
      <button type="button" className="btn secondary admin-array-add" onClick={() => dispatch({ type: "ADD_CONTEXT_QUESTION" })}>
        + Bağlam sorusu ekle
      </button>

      <h2>Endeksler</h2>
      {indexEntries.map(([id, idx]) => (
        <IndexRow key={id} id={id} idx={idx} dispatch={dispatch} />
      ))}
      <button type="button" className="btn secondary admin-array-add" onClick={() => dispatch({ type: "ADD_INDEX" })}>
        + Endeks ekle
      </button>

      <h2>Boyutlar</h2>
      {dimensionEntries.map(([id, dim]) => (
        <DimensionCard key={id} id={id} dim={dim} indexEntries={indexEntries} contextQuestions={contextQuestions} dispatch={dispatch} />
      ))}
      <button type="button" className="btn secondary admin-array-add" onClick={() => dispatch({ type: "ADD_DIMENSION" })}>
        + Boyut ekle
      </button>

      <h2>Sorular ({def.questions.length})</h2>
      {def.questions.map((q) => (
        <QuestionCard
          key={q.id}
          q={q}
          isNew={!originalQuestionIds.has(q.id)}
          dimensionEntries={dimensionEntries}
          contextQuestions={contextQuestions}
          dispatch={dispatch}
        />
      ))}
      <button type="button" className="btn secondary admin-array-add" onClick={() => dispatch({ type: "ADD_QUESTION" })}>
        + Soru ekle
      </button>
    </main>
  );
}

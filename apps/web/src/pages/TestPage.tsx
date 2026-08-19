import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { Answers, Question, TestDefinition } from "@struva/shared";
import { createComparison, fetchTest, submitResult } from "../lib/api";
import { getOrCreateSessionId } from "../lib/session";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

function shuffled<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let k = out.length - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1));
    [out[k], out[j]] = [out[j], out[k]];
  }
  return out;
}

export function TestPage() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const compareWith = searchParams.get("compareWith");

  const [test, setTest] = useState<TestDefinition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [contextAnswers, setContextAnswers] = useState<Record<string, string>>({});
  const [ci, setCi] = useState(0); // contextQuestions ilerlemesi
  const [i, setI] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!testId) return;
    fetchTest(testId)
      .then(setTest)
      .catch(() => setError("Test yüklenemedi."));
  }, [testId]);

  // Gösterim sırası oturum boyunca sabit kalır. Puanlama q.id/q.dim üzerinden
  // çalıştığı için sıra skoru etkilemez.
  const displayQuestions = useMemo<Question[]>(
    () => (test ? shuffled(test.questions) : []),
    [test],
  );

  if (error) {
    return (
      <main className="wrap">
        <Header />
        <div className="card">{error}</div>
        <Footer />
      </main>
    );
  }
  if (!test || displayQuestions.length === 0) {
    return (
      <main className="wrap">
        <Header />
        <div className="card muted">Yükleniyor…</div>
        <Footer />
      </main>
    );
  }

  const contextQuestions = test.contextQuestions ?? [];
  const inContextPhase = ci < contextQuestions.length;

  function chooseContext(idx: number) {
    const cq = contextQuestions[ci];
    setContextAnswers((prev) => ({ ...prev, [cq.id]: cq.options[idx].value }));
    setTimeout(() => setCi((prev) => prev + 1), 220);
  }

  if (inContextPhase) {
    const cq = contextQuestions[ci];
    const selectedContext = contextAnswers[cq.id];
    return (
      <main className="wrap">
        <Header />
        <div className="q-count">
          Ek soru {ci + 1} / {contextQuestions.length}
        </div>
        <h1 className="q-text" tabIndex={-1} aria-live="polite">
          {cq.text}
        </h1>
        <div className="options" role="radiogroup">
          {cq.options.map((opt, idx) => (
            <button
              key={idx}
              type="button"
              role="radio"
              aria-checked={selectedContext === opt.value}
              className={`option${selectedContext === opt.value ? " selected" : ""}`}
              onClick={() => chooseContext(idx)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <Footer />
      </main>
    );
  }

  const q = displayQuestions[i];
  const selected = answers[q.id];
  const isLast = i === displayQuestions.length - 1;

  function choose(idx: number) {
    setAnswers((prev) => ({ ...prev, [q.id]: idx }));
    // Seçim vurgusunu bir an gösterip otomatik sonraki soruya geç; son soruda
    // kullanıcı "Sonucu Gör" ile bilinçli olarak göndersin.
    if (!isLast) {
      setTimeout(() => setI((prev) => prev + 1), 220);
    }
  }

  async function goNext() {
    if (selected == null) return;
    setSubmitting(true);
    try {
      const row = await submitResult({
        testId: test!.id,
        sessionId: getOrCreateSessionId(),
        answers,
        contextAnswers: contextQuestions.length ? contextAnswers : undefined,
      });
      if (compareWith) {
        // Önce kendi sonuç ekranını görsün; kıyaslama oradaki bağlantıdan ayrıca açılır.
        let comparisonId: string | null = null;
        try {
          comparisonId = (await createComparison(compareWith, row.id)).id;
        } catch {
          // Kıyaslama oluşturulamasa bile kendi sonucunu görebilmeli.
        }
        navigate(comparisonId ? `/result/${row.id}?comparisonId=${comparisonId}` : `/result/${row.id}`);
      } else {
        navigate(`/result/${row.id}`);
      }
    } catch {
      setError("Sonuç gönderilemedi, lütfen tekrar deneyin.");
      setSubmitting(false);
    }
  }

  function goPrev() {
    if (i > 0) setI((prev) => prev - 1);
  }

  // Radyo grubu içinde ok tuşlarıyla gezinme (roving tabindex).
  function onOptionsKeyDown(e: React.KeyboardEvent) {
    if (!["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"].includes(e.key)) return;
    const buttons = Array.from(optionsRef.current?.querySelectorAll<HTMLButtonElement>(".option") ?? []);
    const idx = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (idx === -1) return;
    e.preventDefault();
    const dir = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1;
    const next = buttons[(idx + dir + buttons.length) % buttons.length];
    next.focus();
  }

  return (
    <main className="wrap">
      <Header />
      {compareWith && (
        <div className="note" style={{ marginBottom: 16 }}>
          Bu testi tamamladığında cevapların, seni davet eden kişinin sonucuyla kıyaslama
          sayfasında yan yana gösterilecek.
        </div>
      )}
      <div
        className="progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={displayQuestions.length}
        aria-valuenow={i + 1}
      >
        <span style={{ width: `${(i / displayQuestions.length) * 100}%` }} />
      </div>
      <div className="q-count">
        Soru {i + 1} / {displayQuestions.length}
      </div>

      <h1 className="q-text" tabIndex={-1} aria-live="polite">
        {q.text}
      </h1>

      <div className="options" role="radiogroup" ref={optionsRef} onKeyDown={onOptionsKeyDown}>
        {q.options.map((opt, idx) => {
          const isSelected = selected === idx;
          const tabbable = isSelected || (selected == null && idx === 0);
          return (
            <button
              key={idx}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={tabbable ? 0 : -1}
              className={`option${isSelected ? " selected" : ""}`}
              onClick={() => choose(idx)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="nav-row">
        <button type="button" className="btn secondary" style={{ visibility: i === 0 ? "hidden" : "visible" }} onClick={goPrev}>
          Geri
        </button>
        {isLast && (
          <button type="button" className="btn" disabled={selected == null || submitting} onClick={goNext}>
            {submitting ? "Gönderiliyor…" : "Sonucu Gör"}
          </button>
        )}
      </div>

      <Footer />
    </main>
  );
}

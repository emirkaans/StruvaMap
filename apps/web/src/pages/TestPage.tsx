import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { resolveQuestionText, type Answers, type Question, type TestDefinition } from "@struva/shared";
import { createComparison, fetchTest, submitResult } from "../lib/api";
import { track } from "../lib/analytics";
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
  const qHeadingRef = useRef<HTMLHeadingElement>(null);
  // Şıkka arka arkaya basıldığında (mobilde çift dokunma) 220 ms'lik geçiş
  // penceresinde birden fazla ilerleme kuyruğa girip soru atlanmasın.
  const advancing = useRef(false);

  // Yeni soruya geçince odağı başlığa taşı — ekran okuyucu kullanıcısı
  // içeriğin değiştiğini fark etsin (tabIndex={-1} bunun için var).
  useEffect(() => {
    qHeadingRef.current?.focus();
  }, [i, ci]);

  useEffect(() => {
    if (!testId) return;
    track("test_start", { testId });
    let cancelled = false;
    fetchTest(testId)
      .then((t) => {
        if (!cancelled) setTest(t);
      })
      .catch(() => {
        if (!cancelled) setError("Test yüklenemedi.");
      });
    // StrictMode geliştirme modunda effect'i mount→unmount→mount olarak iki kez
    // çalıştırır; bu bayrak olmadan iki ayrı fetch de setTest çağırır, her biri
    // farklı bir nesne referansı taşıdığından displayQuestions iki kez karışır
    // ve soru sırası ilk gösterimden hemen sonra değişmiş gibi görünür.
    return () => {
      cancelled = true;
    };
  }, [testId]);

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
    if (advancing.current) return;
    advancing.current = true;
    const cq = contextQuestions[ci];
    setContextAnswers((prev) => ({ ...prev, [cq.id]: cq.options[idx].value }));
    setTimeout(() => {
      setCi((prev) => Math.min(prev + 1, contextQuestions.length));
      advancing.current = false;
    }, 220);
  }

  if (inContextPhase) {
    const cq = contextQuestions[ci];
    const selectedContext = contextAnswers[cq.id];
    return (
      <main className="wrap">
        <Header />
        <div className="q-panel" key={ci}>
          <div className="q-count">
            Ek soru {ci + 1} / {contextQuestions.length}
          </div>
          <h1 className="q-text" ref={qHeadingRef} tabIndex={-1} aria-live="polite">
            {cq.text}
          </h1>
        </div>
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
  const qText = resolveQuestionText(q, contextQuestions, contextAnswers);
  const selected = answers[q.id];
  const isLast = i === displayQuestions.length - 1;

  const PROGRESS_STEP = 5;

  function choose(idx: number) {
    if (advancing.current) return;
    setAnswers((prev) => ({ ...prev, [q.id]: idx }));
    // Terk noktasını görebilmek için her 5 soruda bir ilerleme kaydı.
    const answered = i + 1;
    if (answered % PROGRESS_STEP === 0) {
      track("test_progress", {
        testId: test!.id,
        props: { answered, total: displayQuestions.length },
      });
    }
    if (!isLast) {
      advancing.current = true;
      setTimeout(() => {
        setI((prev) => Math.min(prev + 1, displayQuestions.length - 1));
        advancing.current = false;
      }, 220);
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
      track("test_complete", { testId: test!.id });
      if (compareWith) {
        let comparisonId: string | null = null;
        try {
          comparisonId = (await createComparison(compareWith, row.id)).id;
        } catch {
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
      <div className="q-panel" key={i}>
        <div className="q-count">
          Soru {i + 1} / {displayQuestions.length}
        </div>

        <h1 className="q-text" ref={qHeadingRef} tabIndex={-1} aria-live="polite">
          {qText}
        </h1>
      </div>

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
          <button type="button" className="btn finish-btn-enter" disabled={selected == null || submitting} onClick={goNext}>
            {submitting ? "Gönderiliyor…" : "Sonucu Gör"}
          </button>
        )}
      </div>

      <Footer />
    </main>
  );
}

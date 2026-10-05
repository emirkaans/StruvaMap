import { useEffect, useMemo, useRef, useState } from "react";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { resolveQuestionText, type Answers, type Question, type TestDefinition } from "@struva/shared";
import { createComparison, fetchTest, getCachedTest, submitResult } from "../lib/api";
import { track } from "../lib/analytics";
import { getOrCreateSessionId } from "../lib/session";
import { minutesFromSubtitle, toTurkishUpper } from "../lib/text";
import { answeredCount, clearProgress, loadProgress, saveProgress, type SavedProgress } from "../lib/testProgress";
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

/* Başka bir teste geçildiğinde (ör. alt menüden) bileşen yeniden kurulsun:
   önbellekten okunan ilk durum, cevaplar ve sıra eski testten kalmasın. */
export function TestPage() {
  const { testId } = useParams<{ testId: string }>();
  const [searchParams] = useSearchParams();
  return <TestFlow key={`${testId}|${searchParams.get("compareWith") ?? ""}`} />;
}

function TestFlow() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const compareWith = searchParams.get("compareWith");

  // Anasayfadan gelindiyse tanım bellekte hazır: ilk çizimde "Yükleniyor" yok.
  const [test, setTest] = useState<TestDefinition | null>(() => (testId ? getCachedTest(testId) : null));
  const [error, setError] = useState<string | null>(null);
  // Giriş ekranında bulunan yarım test (varsa) ve başlanıp başlanmadığı.
  const [saved, setSaved] = useState<SavedProgress | null>(() =>
    test ? loadProgress(test.id, compareWith, test.questions.map((q) => q.id)) : null,
  );
  const [started, setStarted] = useState(false);
  // Gösterilen soru sırası (question.id); başlarken karıştırılır ya da
  // kaydedilmiş sıradan geri yüklenir.
  const [order, setOrder] = useState<number[]>([]);
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
  useDocumentTitle(test?.name);

  // Yeni soruya geçince odağı başlığa taşı — ekran okuyucu kullanıcısı
  // içeriğin değiştiğini fark etsin (tabIndex={-1} bunun için var).
  useEffect(() => {
    // preventScroll: odak sayfayı başlığa kaydırıp ilerleme çubuğunu ve soru
    // etiketini ekran dışına itmesin.
    if (started) qHeadingRef.current?.focus({ preventScroll: true });
  }, [i, ci, started]);

  useEffect(() => {
    if (!testId) return;
    track("test_start", { testId });
    // Tanım önbellekten geldiyse yeniden istemeye gerek yok.
    if (test?.id === testId) return;
    let cancelled = false;
    fetchTest(testId)
      .then((t) => {
        if (cancelled) return;
        setTest(t);
        setSaved(loadProgress(t.id, compareWith, t.questions.map((q) => q.id)));
      })
      .catch(() => {
        if (!cancelled) setError("Test yüklenemedi.");
      });
    // StrictMode geliştirme modunda effect'i mount→unmount→mount olarak iki kez
    // çalıştırır; bu bayrak olmadan iki ayrı fetch de setTest çağırır.
    return () => {
      cancelled = true;
    };
    // test bilerek bağımlılık değil: yalnızca testId değişince yüklenir.
  }, [testId, compareWith]);

  // Her cevapta ilerleme bu cihaza yazılır; gönderim başarılı olunca silinir.
  useEffect(() => {
    if (!test || !started || order.length === 0) return;
    saveProgress(test.id, compareWith, { order, answers, contextAnswers, ci, i, savedAt: Date.now() });
  }, [test, compareWith, started, order, answers, contextAnswers, ci, i]);

  const displayQuestions = useMemo<Question[]>(() => {
    if (!test) return [];
    const byId = new Map(test.questions.map((q) => [q.id, q]));
    return order.flatMap((id) => byId.get(id) ?? []);
  }, [test, order]);

  if (error) {
    return (
      <main className="wrap">
        <Header />
        <div className="card">{error}</div>
        <Footer />
      </main>
    );
  }
  if (!test) {
    return (
      <main className="wrap">
        <Header />
        <div className="card muted">Yükleniyor…</div>
        <Footer />
      </main>
    );
  }

  const contextQuestions = test.contextQuestions ?? [];

  function begin(resume: boolean) {
    if (resume && saved) {
      setOrder(saved.order);
      setAnswers(saved.answers);
      setContextAnswers(saved.contextAnswers);
      setCi(saved.ci);
      setI(saved.i);
    } else {
      clearProgress(test!.id, compareWith);
      setOrder(shuffled(test!.questions.map((q) => q.id)));
      setAnswers({});
      setContextAnswers({});
      setCi(0);
      setI(0);
    }
    setStarted(true);
    window.scrollTo(0, 0);
  }

  if (!started || displayQuestions.length === 0) {
    const total = test.questions.length + contextQuestions.length;
    const done = saved ? answeredCount(saved) : 0;
    return (
      <main className="wrap">
        <Header />
        <section className="test-intro q-panel">
          <span className="eyebrow">{toTurkishUpper(test.name)}</span>
          <h1>Başlamadan önce.</h1>
          <p className="test-intro-lead">
            Bu bir sınav değil. Her ifadede ilişkinizi bugün nasıl yaşıyorsanız onu işaretleyin. Doğru ya da yanlış
            cevap yok; yalnızca görünür kılınmayı bekleyen bir yapı var.
          </p>
          <div className="test-intro-facts">
            <div>
              <b>{total}</b>
              <span>ifade</span>
            </div>
            <div>
              <b>~{minutesFromSubtitle(test.subtitle)} dk</b>
              <span>süre</span>
            </div>
            <div>
              <b>{Object.keys(test.dimensions).length}</b>
              <span>boyut</span>
            </div>
          </div>
          <ul className="test-intro-notes">
            {compareWith && (
              <li>Bitirdiğinde cevapların, seni davet eden kişinin sonucuyla yan yana gösterilecek.</li>
            )}
            <li>Cevapların yalnızca puanlama için kullanılır. Hesap açılmaz, kimlik bilgisi istenmez.</li>
            <li>İstediğin an ara verebilirsin; ilerlemen bu cihazda saklanır.</li>
            <li>StruvaMap 18 yaş ve üzerindeki kişiler içindir.</li>
          </ul>
          <div className="test-intro-actions">
            {saved && done > 0 ? (
              <>
                <button type="button" className="btn" onClick={() => begin(true)}>
                  Kaldığın yerden devam et ({done} / {total})
                </button>
                <button type="button" className="btn secondary" onClick={() => begin(false)}>
                  Baştan başla
                </button>
              </>
            ) : (
              <button type="button" className="btn" onClick={() => begin(false)}>
                Başla →
              </button>
            )}
          </div>
        </section>
        <Footer />
      </main>
    );
  }

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
          <div className="q-meta">
            <span className="q-dim">{toTurkishUpper("Bağlam")}</span>
            <span className="q-count">
              Ek soru {ci + 1} / {contextQuestions.length}
            </span>
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
  const dim = test.dimensions[q.dim];
  const indexName = dim ? test.indices[dim.index]?.name : undefined;

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
      clearProgress(test!.id, compareWith);
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
        <div className="q-meta">
          {dim && (
            <span className="q-dim">
              {indexName ? `${toTurkishUpper(indexName)} · ` : ""}
              {toTurkishUpper(dim.name)}
            </span>
          )}
          <span className="q-count">
            Soru {i + 1} / {displayQuestions.length}
          </span>
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
      <p className="q-saved-note">İlerlemen bu cihazda saklanıyor; sayfayı kapatsan da kaldığın yerden devam edebilirsin.</p>

      <Footer />
    </main>
  );
}

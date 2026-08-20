import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { TestDefinition } from "@struva/shared";
import { bandOf as interpBandOf } from "@struva/shared";
import { fetchComparison, fetchTest, type ComparisonRow } from "../lib/api";
import { toTurkishUpper } from "../lib/text";
import { Donut, bandOf } from "../components/charts";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { AppCta } from "../components/AppCta";

const PERCEPTION_GAP_THRESHOLD = 20;

function gapBand(gap: number): "good" | "mid" | "low" {
  if (gap >= PERCEPTION_GAP_THRESHOLD) return "low";
  if (gap >= PERCEPTION_GAP_THRESHOLD / 2) return "mid";
  return "good";
}

export function ComparisonPage() {
  const { comparisonId } = useParams<{ comparisonId: string }>();
  const [comparison, setComparison] = useState<ComparisonRow | null>(null);
  const [test, setTest] = useState<TestDefinition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!comparisonId) return;
    fetchComparison(comparisonId)
      .then((row) => {
        setComparison(row);
        return fetchTest(row.testId);
      })
      .then(setTest)
      .catch(() => setError("Kıyaslama bulunamadı."));
  }, [comparisonId]);

  if (error) {
    return (
      <main className="wrap">
        <div className="card">
          <h1>Kıyaslama bulunamadı</h1>
          <p className="muted">Bağlantı geçersiz olabilir.</p>
        </div>
      </main>
    );
  }

  if (!comparison || !test) {
    return (
      <main className="wrap">
        <div className="card muted">Yükleniyor…</div>
      </main>
    );
  }

  const { a, b } = comparison;
  const rsiGap = Math.abs(a.score.rsi - b.score.rsi);

  return (
    <main className="wrap">
      <Header className="no-print" />

      <div className="score-hero">
        <span className="eyebrow">{toTurkishUpper("Kıyaslama")}</span>
        <p className="muted small" style={{ marginBottom: 0 }}>{test.name}</p>

        <div className="duel">
          <div className="duel-side">
            <div className="duel-donut">
              <Donut value={a.score.rsi} size={132} stroke={11} label="Davet eden — İlişki Yapısı Skoru" />
              <div className="overlay" aria-hidden="true">{a.score.rsi}</div>
            </div>
            <div className="l">Davet eden</div>
          </div>

          <div className="duel-delta">
            <span className="duel-delta-label">{toTurkishUpper("Fark")}</span>
            <span className={`duel-delta-val ${gapBand(rsiGap)}`}>{rsiGap}</span>
          </div>

          <div className="duel-side">
            <div className="duel-donut">
              <Donut value={b.score.rsi} size={132} stroke={11} label="Katılan — İlişki Yapısı Skoru" />
              <div className="overlay" aria-hidden="true">{b.score.rsi}</div>
            </div>
            <div className="l">Katılan</div>
          </div>
        </div>

        <p className="small muted" style={{ maxWidth: 460, margin: "16px auto 0" }}>
          {rsiGap >= PERCEPTION_GAP_THRESHOLD
            ? `İki taraf arasında ${rsiGap} puanlık belirgin bir genel algı farkı var.`
            : "Genel skorlar birbirine yakın; büyük bir algı farkı görünmüyor."}
        </p>
      </div>

      <div className="card actions-card no-print">
        <div className="actions-row">
          <Link to="/" className="btn secondary">
            Anasayfaya Dön
          </Link>
          <button
            type="button"
            className="btn secondary"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              });
            }}
          >
            {copied ? "Kopyalandı!" : "Bağlantıyı kopyala"}
          </button>
        </div>
      </div>

      <h2>Boyut Bazında Kıyaslama</h2>
      {Object.keys(test.dimensions).map((dim) => {
        const aScore = a.score.dimensions[dim];
        const bScore = b.score.dimensions[dim];
        const gap = Math.abs(aScore - bScore);
        const hasGap = gap >= PERCEPTION_GAP_THRESHOLD;
        const lowerSide: "a" | "b" = aScore <= bScore ? "a" : "b";
        const lowerLabel = lowerSide === "a" ? "Davet eden" : "Katılan";
        const lowerScore = lowerSide === "a" ? aScore : bScore;
        const avgScore = Math.round((aScore + bScore) / 2);
        const assessment = hasGap
          ? `${lowerLabel} bu alanı daha dengesiz algılıyor: ${test.dimensions[dim].interpretation[interpBandOf(lowerScore)]}`
          : `İki taraf bu alanı benzer algılıyor (${gap} puan fark): ${test.dimensions[dim].interpretation[interpBandOf(avgScore)]}`;
        return (
          <div className="card compare-dim" key={dim}>
            <h3>
              {test.dimensions[dim].name}
              {hasGap && <span className="tag low">algı farkı {gap}</span>}
            </h3>
            <div className="bar-row">
              <div className="bar-head">
                <span>Davet eden</span>
                <span className="val">{aScore}</span>
              </div>
              <div className={`bar ${bandOf(aScore)}`}>
                <span style={{ width: `${aScore}%` }} />
              </div>
            </div>
            <div className="bar-row">
              <div className="bar-head">
                <span>Katılan</span>
                <span className="val">{bScore}</span>
              </div>
              <div className={`bar ${bandOf(bScore)}`}>
                <span style={{ width: `${bScore}%` }} />
              </div>
            </div>
            <p className="small muted" style={{ margin: "10px 0 0" }}>
              {assessment}
            </p>
          </div>
        );
      })}

      <div className="disclaimer">
        <span className="eyebrow">{toTurkishUpper("Teşhis değil")}</span>
        <p>
          Bu kıyaslama teşhis değildir; yalnızca iki tarafın aynı ilişkiyi ne kadar benzer ya da
          farklı algıladığını gösterir. Büyük farklar konuşmaya değer bir başlangıç noktasıdır.
        </p>
      </div>

      <AppCta variant="compact" />

      <Footer />
    </main>
  );
}

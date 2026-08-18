import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { TestDefinition } from "@struva/shared";
import { bandOf as interpBandOf } from "@struva/shared";
import { fetchComparison, fetchTest, type ComparisonRow } from "../lib/api";
import { Donut, bandOf } from "../components/charts";

// Algı farkı bu eşiğin üstündeyse "algı farkı" olarak işaretlenir.
const PERCEPTION_GAP_THRESHOLD = 20;

export function ComparisonPage() {
  const { comparisonId } = useParams<{ comparisonId: string }>();
  const [comparison, setComparison] = useState<ComparisonRow | null>(null);
  const [test, setTest] = useState<TestDefinition | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      <div className="card score-hero">
        <div className="muted small">{test.name} — Kıyaslama</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 32, marginTop: 14, flexWrap: "wrap" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ position: "relative", width: 132, height: 132 }}>
              <Donut value={a.score.rsi} size={132} stroke={11} label="Davet eden — İlişki Yapısı Skoru" />
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.4rem",
                  fontWeight: 700,
                }}
              >
                {a.score.rsi}
              </div>
            </div>
            <div className="l" style={{ marginTop: 6 }}>Davet eden</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ position: "relative", width: 132, height: 132 }}>
              <Donut value={b.score.rsi} size={132} stroke={11} label="Katılan — İlişki Yapısı Skoru" />
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.4rem",
                  fontWeight: 700,
                }}
              >
                {b.score.rsi}
              </div>
            </div>
            <div className="l" style={{ marginTop: 6 }}>Katılan</div>
          </div>
        </div>
        <p className="small muted" style={{ maxWidth: 460, margin: "16px auto 0" }}>
          {rsiGap >= PERCEPTION_GAP_THRESHOLD
            ? `İki taraf arasında ${rsiGap} puanlık belirgin bir genel algı farkı var.`
            : "Genel skorlar birbirine yakın; büyük bir algı farkı görünmüyor."}
        </p>
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
          <div className="card" key={dim}>
            <h3 style={{ marginBottom: 10 }}>
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
            <div className="bar-row" style={{ marginBottom: 0 }}>
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

      <div className="note" style={{ margin: "20px 0" }}>
        Bu kıyaslama teşhis değildir; yalnızca iki tarafın aynı ilişkiyi ne kadar benzer ya da farklı
        algıladığını gösterir. Büyük farklar konuşmaya değer bir başlangıç noktasıdır.
      </div>
    </main>
  );
}

import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import type { ScoreResult, TestDefinition } from "@struva/shared";
import { fetchResult, fetchResultHistory, fetchTest, type ResultRow } from "../lib/api";
import { BRAND, PLAY_STORE_URL } from "../lib/config";
import { toTurkishUpper } from "../lib/text";
import { Bar, Donut, Radar, TrendChart, bandHex, bandOf } from "../components/charts";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

// Paylaşım görseli — kütüphanesiz SVG, canvas üzerinden PNG'e çevrilir.
function buildShareSvg(test: TestDefinition, r: ScoreResult): string {
  const W = 600;
  const H = 240 + Object.keys(test.dimensions).length * 46 + 20;
  let rows = "";
  Object.keys(test.dimensions).forEach((d, i) => {
    const y = 240 + i * 46;
    const val = r.dimensions[d];
    rows +=
      `<text x="40" y="${y}" font-size="16" fill="#1c1c1a" font-family="system-ui,sans-serif">${test.dimensions[d].name}</text>` +
      `<rect x="220" y="${y - 14}" width="340" height="10" rx="5" fill="#e4e4df"/>` +
      `<rect x="220" y="${y - 14}" width="${((340 * val) / 100).toFixed(1)}" height="10" rx="5" fill="${bandHex(val)}"/>` +
      `<text x="570" y="${y}" font-size="14" fill="#6b6b66" text-anchor="end" font-family="system-ui,sans-serif">${val}</text>`;
  });
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<rect width="${W}" height="${H}" fill="#ffffff"/>` +
    `<text x="40" y="56" font-size="24" font-weight="700" fill="#1c1c1a" font-family="system-ui,sans-serif">${BRAND}</text>` +
    `<text x="40" y="82" font-size="13" fill="#6b6b66" font-family="system-ui,sans-serif">${test.name}</text>` +
    `<text x="40" y="170" font-size="72" font-weight="800" fill="#3a5a78" font-family="system-ui,sans-serif">${r.rsi}` +
    `<tspan font-size="20" fill="#6b6b66"> / 100</tspan></text>` +
    `<text x="40" y="216" font-size="15" fill="#1c1c1a" font-weight="600" font-family="system-ui,sans-serif">Boyutlar</text>` +
    rows +
    `</svg>`
  );
}

function downloadShareImage(test: TestDefinition, r: ScoreResult) {
  const svgStr = buildShareSvg(test, r);
  const W = 600;
  const H = 240 + Object.keys(test.dimensions).length * 46 + 20;
  const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    canvas.toBlob((pngBlob) => {
      if (!pngBlob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(pngBlob);
      a.download = "struvamap-sonuc.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
    }, "image/png");
  };
  img.src = url;
}

export function ResultPage() {
  const { resultId } = useParams<{ resultId: string }>();
  const [searchParams] = useSearchParams();
  const comparisonId = searchParams.get("comparisonId");
  const [result, setResult] = useState<ResultRow | null>(null);
  const [test, setTest] = useState<TestDefinition | null>(null);
  const [history, setHistory] = useState<ResultRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  useEffect(() => {
    if (!resultId) return;
    fetchResult(resultId)
      .then((row) => {
        setResult(row);
        fetchResultHistory(row.session_id, row.test_id)
          .then(setHistory)
          .catch(() => setHistory([]));
        return fetchTest(row.test_id);
      })
      .then(setTest)
      .catch(() => setError("Sonuç bulunamadı."));
  }, [resultId]);

  if (error) {
    return (
      <main className="wrap">
        <div className="card">
          <h1>Sonuç bulunamadı</h1>
          <p className="muted">Bağlantı geçersiz olabilir.</p>
        </div>
      </main>
    );
  }

  if (!result || !test) {
    return (
      <main className="wrap">
        <div className="card muted">Yükleniyor…</div>
      </main>
    );
  }

  const r = result.score;

  const strengthList = r.strengths.length
    ? r.strengths.map((d) => (
        <li key={d}>
          {test.dimensions[d].name} <strong>{r.dimensions[d]}</strong>
        </li>
      ))
    : <li className="muted">Belirgin bir güçlü alan öne çıkmadı.</li>;

  const tensionList = r.tensions.length
    ? r.tensions.map((d) => (
        <li key={d}>
          {test.dimensions[d].name} <strong>{r.dimensions[d]}</strong>
        </li>
      ))
    : <li className="muted">Belirgin bir gerilim alanı öne çıkmadı.</li>;

  const interp = [...r.interpretation].sort((a, b) => a.score - b.score);

  return (
    <main className="wrap">
      <Header className="no-print" />

      <div className="score-hero">
        <span className="eyebrow">{toTurkishUpper(test.name)}</span>
        <div className="gauge">
          <Donut value={r.rsi} size={172} stroke={14} label="İlişki Yapısı Skoru" />
          <div className="overlay" aria-hidden="true">
            <div className="big">
              {r.rsi}
              <small> / 100</small>
            </div>
          </div>
        </div>
        <p className="small muted" style={{ maxWidth: 440, margin: "12px auto 0" }}>
          Bu puan incelenen alanlardaki denge/uyum düzeyini gösterir; "ilişki sağlığı yüzdesi" değildir.
        </p>
      </div>

      {comparisonId && (
        <div className="card no-print" style={{ textAlign: "center" }}>
          <h3 style={{ marginBottom: 8 }}>Kıyaslama hazır</h3>
          <p className="small muted">Seni davet eden kişinin sonucuyla yan yana karşılaştırma.</p>
          <Link to={`/comparisons/${comparisonId}`} className="btn">
            Kıyaslamayı gör
          </Link>
        </div>
      )}

      <div className="card actions-card no-print">
        <div className="actions-row">
          <Link to="/" className="btn secondary">
            Anasayfaya Dön
          </Link>
          <button type="button" className="btn secondary" onClick={() => window.print()}>
            PDF olarak indir / Yazdır
          </button>
          <button type="button" className="btn secondary" onClick={() => downloadShareImage(test, r)}>
            Sonucu görsel indir
          </button>
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
          {!comparisonId && (
            <button
              type="button"
              className="btn secondary"
              onClick={() => {
                const url = `${window.location.origin}/test/${test.id}?compareWith=${result.id}`;
                navigator.clipboard.writeText(url).then(() => {
                  setInviteCopied(true);
                  setTimeout(() => setInviteCopied(false), 1800);
                });
              }}
            >
              {inviteCopied ? "Davet bağlantısı kopyalandı!" : test.inviteCta}
            </button>
          )}
        </div>
        {!comparisonId && (
          <p className="small muted" style={{ margin: "10px 0 0" }}>
            Bu bağlantıyı açan herkes sonucu görebilir. Davet bağlantısını açan kişi aynı testi
            çözdüğünde ikinizin cevapları kıyaslama sayfasında yan yana gösterilir.
          </p>
        )}
      </div>

      <div className="indices">
        {Object.entries(test.indices).map(([key, idx]) => (
          <div className="index-card" key={key}>
            <div className="donut-ring">
              <Donut value={r.indices[key]} size={108} stroke={9} label={idx.name} />
              <div className="overlay" aria-hidden="true">
                {r.indices[key]}
              </div>
            </div>
            <div className="l">{idx.name}</div>
          </div>
        ))}
      </div>

      <h2>Boyutlar</h2>
      <div className="card radar-card">
        <Radar
          dimensions={r.dimensions}
          labels={Object.fromEntries(Object.keys(test.dimensions).map((k) => [k, test.dimensions[k].name]))}
        />
      </div>
      <div className="card">
        {Object.keys(test.dimensions).map((dim) => (
          <Bar key={dim} name={test.dimensions[dim].name} score={r.dimensions[dim]} />
        ))}
      </div>

      <div className="split-row">
        <div className="split-col strengths">
          <h3>En güçlü alanlar</h3>
          <ul>{strengthList}</ul>
        </div>
        <div className="split-col tensions">
          <h3>Yapısal gerilim alanları</h3>
          <ul>{tensionList}</ul>
        </div>
      </div>

      <h2>Sosyolojik Yorum</h2>
      <div className="card">
        {interp.map((it) => (
          <div className="interp-item" key={it.dim}>
            <h3>
              {it.name} — {it.score}
              {bandOf(it.score) === "good" && <span className="tag good">güçlü</span>}
              {bandOf(it.score) === "low" && <span className="tag low">gerilim</span>}
            </h3>
            <p className="small muted" style={{ margin: 0 }}>
              {it.text}
            </p>
          </div>
        ))}
      </div>

      <h2>Zamanla Değişim</h2>
      <div className="card trend-card">
        {history && history.length >= 2 ? (
          <TrendChart
            history={history.map((h) => ({ ts: new Date(h.created_at).getTime(), rsi: h.score.rsi }))}
          />
        ) : (
          <p className="muted small" style={{ margin: 0 }}>
            Trend için bu testi tekrar çözün.
          </p>
        )}
      </div>

      <div className="disclaimer">
        <span className="eyebrow">{toTurkishUpper("Teşhis değil")}</span>
        <p>
          Bu analiz tanımlayıcıdır. <em>"Toksik", "sağlıksız"</em> gibi etiketler kullanmaz; yalnızca
          yapısal denge, asimetri ve sınırları tanımlar.
        </p>
      </div>

      <div className="app-cta no-print">
        <div className="copy">
          <span className="eyebrow">{toTurkishUpper("Mobil uygulama")}</span>
          <h2>Bu yalnızca başlangıç.</h2>
          <p>
            Ekonomik güç, duygusal emek, yaşam tarzı uyumu ve "istenen yapı vs mevcut yapı" farkı gibi
            derin analizler mobil uygulamada.
          </p>
        </div>
        <a href={PLAY_STORE_URL} className="btn" target="_blank" rel="noopener">
          Google Play'den İndir
        </a>
      </div>

      <Footer />
    </main>
  );
}

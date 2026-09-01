import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { composeProfileStory, computeProfileLabel, type ScoreResult, type TestDefinition } from "@struva/shared";
import { fetchComparisonByResultId, fetchResult, fetchResultHistory, fetchTest, type ResultRow } from "../lib/api";
import { track } from "../lib/analytics";
import { toTurkishUpper } from "../lib/text";
import { useCountUp } from "../lib/useCountUp";
import { Bar, Donut, Radar, TrendChart, bandHex, bandOf } from "../components/charts";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { AppCta } from "../components/AppCta";
import { Reveal } from "../components/Reveal";

const SHARE_FONT = "Archivo,system-ui,sans-serif";
const SHARE_BODY_FONT = "'Source Sans 3',system-ui,sans-serif";
const SHARE_MONO_FONT = "'IBM Plex Mono',ui-monospace,monospace";

/* Kelime bazlı basit satır sarma — SVG <text> otomatik sarmaz. Font/boyut
   değişirse maxChars'ı ayarlamak yeterli, ölçüm yapmıyoruz (hız/basitlik). */
function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildShareSvg(test: TestDefinition, r: ScoreResult, profile: { title: string; description: string }): string {
  const W = 1080;
  const PAD = 72;

  // Sağ üstte gerçek uygulamadaki gibi bir RSI halkası — kart artık düz metin
  // değil, tanınabilir bir "skor grafiği" gibi görünsün diye.
  const donutSize = 168;
  const donutStroke = 14;
  const donutR = (donutSize - donutStroke) / 2;
  const donutCirc = 2 * Math.PI * donutR;
  const v = Math.max(0, Math.min(100, r.rsi));
  const donutOff = donutCirc * (1 - v / 100);
  const donutCx = W - PAD - donutSize / 2;

  const fullColW = W - PAD * 2;
  const textColW = fullColW - donutSize - 48;
  const titleMaxChars = Math.max(10, Math.round(22 * (textColW / fullColW)));
  const descMaxChars = Math.max(24, Math.round(62 * (textColW / fullColW)));

  const titleLines = wrapText(profile.title, titleMaxChars);
  const descLines = wrapText(profile.description, descMaxChars).slice(0, 3);

  let y = 150;
  const eyebrowY = y;
  y += 64;
  const titleStartY = y;
  const titleLineHeight = 70;
  y += titleLines.length * titleLineHeight;
  y += 36;
  const descStartY = y;
  const descLineHeight = 32;
  y += descLines.length * descLineHeight;
  y += 40;

  const donutTop = eyebrowY - 40;
  const donutCy = donutTop + donutSize / 2;
  const dividerY = Math.max(y, donutTop + donutSize + 40);
  y = dividerY + 48;
  const barsStartY = y;
  const barRowHeight = 58;
  const dimIds = Object.keys(test.dimensions);
  y += dimIds.length * barRowHeight;
  y += 60; // alt boşluk + footer

  const H = y;

  const titleSvg = titleLines
    .map((line, i) => `<tspan x="${PAD}" y="${titleStartY + i * titleLineHeight}">${esc(line)}</tspan>`)
    .join("");
  const descSvg = descLines
    .map((line, i) => `<tspan x="${PAD}" y="${descStartY + i * descLineHeight}">${esc(line)}</tspan>`)
    .join("");

  const donutSvg =
    `<circle cx="${donutCx}" cy="${donutCy}" r="${donutR}" fill="none" stroke="#20222b" stroke-width="${donutStroke}"/>` +
    `<circle cx="${donutCx}" cy="${donutCy}" r="${donutR}" fill="none" stroke="${bandHex(v)}" stroke-width="${donutStroke}" ` +
    `stroke-linecap="round" stroke-dasharray="${donutCirc.toFixed(2)}" stroke-dashoffset="${donutOff.toFixed(2)}" ` +
    `transform="rotate(-90 ${donutCx} ${donutCy})"/>` +
    `<text x="${donutCx}" y="${donutCy + 12}" font-size="44" font-weight="700" fill="#ecedef" text-anchor="middle" font-family="${SHARE_MONO_FONT}">${r.rsi}</text>` +
    `<text x="${donutCx}" y="${donutCy + 38}" font-size="15" font-weight="600" fill="#9092a0" text-anchor="middle" font-family="${SHARE_MONO_FONT}">/ 100</text>`;

  let bars = "";
  dimIds.forEach((d, i) => {
    const rowY = barsStartY + i * barRowHeight;
    const val = r.dimensions[d];
    const barW = W - PAD * 2 - 60;
    bars +=
      `<text x="${PAD}" y="${rowY}" font-size="19" fill="#ecedef" font-family="${SHARE_BODY_FONT}">${esc(test.dimensions[d].name)}</text>` +
      `<text x="${W - PAD}" y="${rowY}" font-size="17" fill="#9092a0" text-anchor="end" font-family="${SHARE_MONO_FONT}">${val}</text>` +
      `<rect x="${PAD}" y="${rowY + 12}" width="${barW}" height="10" rx="5" fill="#20222b"/>` +
      `<rect x="${PAD}" y="${rowY + 12}" width="${((barW * val) / 100).toFixed(1)}" height="10" rx="5" fill="${bandHex(val)}"/>`;
  });

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<defs><radialGradient id="glow" cx="82%" cy="6%" r="70%">` +
    `<stop offset="0%" stop-color="#5470ff" stop-opacity="0.28"/>` +
    `<stop offset="55%" stop-color="#5470ff" stop-opacity="0.06"/>` +
    `<stop offset="100%" stop-color="#5470ff" stop-opacity="0"/>` +
    `</radialGradient></defs>` +
    `<rect width="${W}" height="${H}" fill="#0b0c10"/>` +
    `<rect width="${W}" height="${H}" fill="url(#glow)"/>` +
    `<text x="${PAD}" y="${eyebrowY}" font-size="20" font-weight="600" letter-spacing="2.5" fill="#5470ff" font-family="${SHARE_MONO_FONT}">${esc(test.name.toUpperCase())}</text>` +
    `<text font-size="58" font-weight="800" fill="#ecedef" font-family="${SHARE_FONT}">${titleSvg}</text>` +
    `<text font-size="24" fill="#9092a0" font-family="${SHARE_BODY_FONT}">${descSvg}</text>` +
    donutSvg +
    `<line x1="${PAD}" y1="${dividerY}" x2="${W - PAD}" y2="${dividerY}" stroke="#26272f" stroke-width="1"/>` +
    bars +
    `<text x="${PAD}" y="${H - 40}" font-size="22" font-weight="800" font-family="${SHARE_FONT}">` +
    `<tspan fill="#ecedef">Struva</tspan><tspan fill="#5470ff">Map</tspan></text>` +
    `<text x="${W - PAD}" y="${H - 40}" font-size="16" fill="#9092a0" text-anchor="end" font-family="${SHARE_BODY_FONT}">struvamap.netlify.app</text>` +
    `</svg>`
  );
}

function downloadShareImage(test: TestDefinition, r: ScoreResult, profile: { title: string; description: string }) {
  const svgStr = buildShareSvg(test, r, profile);
  const parsed = /width="(\d+)" height="(\d+)"/.exec(svgStr);
  const W = parsed ? Number(parsed[1]) : 1080;
  const H = parsed ? Number(parsed[2]) : 800;
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

function invitedStorageKey(resultId: string): string {
  return `struva_invited_${resultId}`;
}

export function ResultPage() {
  const { resultId } = useParams<{ resultId: string }>();
  const [searchParams] = useSearchParams();
  const comparisonIdFromUrl = searchParams.get("comparisonId");
  const [result, setResult] = useState<ResultRow | null>(null);
  const [test, setTest] = useState<TestDefinition | null>(null);
  const [history, setHistory] = useState<ResultRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [invited, setInvited] = useState(false);
  const [foundComparisonId, setFoundComparisonId] = useState<string | null>(null);
  const comparisonId = comparisonIdFromUrl ?? foundComparisonId;

  useEffect(() => {
    if (!resultId) return;
    fetchResult(resultId)
      .then((row) => {
        setResult(row);
        track("result_view", { testId: row.test_id });
        setInvited(localStorage.getItem(invitedStorageKey(row.id)) === "1");
        fetchResultHistory(row.session_id, row.test_id)
          .then(setHistory)
          .catch(() => setHistory([]));
        return fetchTest(row.test_id);
      })
      .then(setTest)
      .catch(() => setError("Sonuç bulunamadı."));
  }, [resultId]);

  // Davet gönderildiyse ve henüz bir kıyaslama yoksa, karşı taraf testi
  // bitirdiğinde sayfayı yenilemeye gerek kalmadan haberdar olalım.
  useEffect(() => {
    if (!result || comparisonId || !invited) return;
    let cancelled = false;
    const poll = () => {
      fetchComparisonByResultId(result.id)
        .then((found) => {
          if (!cancelled && found) {
            setFoundComparisonId(found.id);
            track("comparison_ready", { testId: result.test_id });
          }
        })
        .catch(() => {});
    };
    const interval = setInterval(poll, 6000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [result, comparisonId, invited]);

  const rsiCount = useCountUp(result?.score.rsi ?? 0);

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
  const profile = computeProfileLabel(test.indices, r.indices);
  const story = composeProfileStory(profile, r.interpretation, r.strengths, r.tensions);

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

      <Reveal className="score-hero">
        <span className="eyebrow">{toTurkishUpper(test.name)}</span>
        <h1 className="profile-title">{profile.title}</h1>
        <p className="profile-desc">{story}</p>
        <div className="gauge">
          <Donut value={r.rsi} size={172} stroke={14} label="İlişki Yapısı Skoru" />
          <div className="overlay" aria-hidden="true">
            <div className="big">
              {rsiCount}
              <small> / 100</small>
            </div>
          </div>
        </div>
        <p className="small muted" style={{ maxWidth: 440, margin: "12px auto 0" }}>
          Bu puan incelenen alanlardaki denge/uyum düzeyini gösterir; "ilişki sağlığı yüzdesi" değildir.
        </p>
      </Reveal>

      {comparisonIdFromUrl && (
        <Reveal className="card no-print" style={{ textAlign: "center" }}>
          <h3 style={{ marginBottom: 8 }}>Kıyaslama hazır</h3>
          <p className="small muted">Seni davet eden kişinin sonucuyla yan yana karşılaştırma.</p>
          <Link to={`/comparisons/${comparisonIdFromUrl}`} className="btn">
            Kıyaslamayı gör
          </Link>
        </Reveal>
      )}

      {foundComparisonId && (
        <Reveal className="card no-print" style={{ textAlign: "center" }}>
          <h3 style={{ marginBottom: 8 }}>Kıyaslama hazır</h3>
          <p className="small muted">Davet ettiğin kişi testi tamamladı — sonuçlarınız yan yana hazır.</p>
          <Link to={`/comparisons/${foundComparisonId}`} className="btn">
            Kıyaslamayı gör
          </Link>
        </Reveal>
      )}

      {invited && !comparisonId && (
        <Reveal className="card no-print" style={{ textAlign: "center" }}>
          <h3 style={{ marginBottom: 8 }}>Davet gönderildi</h3>
          <p className="small muted">
            Karşı taraf testi tamamladığında kıyaslama burada otomatik görünecek.
          </p>
          <span className="waiting-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </Reveal>
      )}

      <Reveal className="card actions-card no-print">
        <div className="actions-row">
          <Link to="/" className="btn secondary">
            Anasayfaya Dön
          </Link>
          <button
            type="button"
            className="btn secondary"
            onClick={() => {
              track("print_pdf", { testId: test.id });
              window.print();
            }}
          >
            PDF olarak indir / Yazdır
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={() => {
              track("share_image_download", { testId: test.id });
              downloadShareImage(test, r, profile);
            }}
          >
            Sonucu görsel indir
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href).then(() => {
                track("link_copied", { testId: test.id });
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
                  track("invite_copied", { testId: test.id });
                  localStorage.setItem(invitedStorageKey(result.id), "1");
                  setInvited(true);
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
      </Reveal>

      <Reveal group className="indices">
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
      </Reveal>

      <h2>Boyutlar</h2>
      <Reveal className="card radar-card">
        <Radar
          dimensions={r.dimensions}
          labels={Object.fromEntries(Object.keys(test.dimensions).map((k) => [k, test.dimensions[k].name]))}
        />
      </Reveal>
      <Reveal group className="card">
        {Object.keys(test.dimensions).map((dim) => {
          const satisfaction = r.satisfaction?.[dim];
          const imbalancedButSatisfied =
            satisfaction != null && bandOf(r.dimensions[dim]) === "low" && bandOf(satisfaction) === "good";
          return (
            <div key={dim}>
              <Bar name={test.dimensions[dim].name} score={r.dimensions[dim]} />
              {satisfaction != null && (
                <p className="small muted" style={{ margin: "-8px 0 12px" }}>
                  Memnuniyet: {satisfaction}/100
                  {imbalancedButSatisfied && " — dağılım dengesiz görünüyor, ama memnuniyet yüksek; bu rızaya dayalı bir tercih olabilir."}
                </p>
              )}
            </div>
          );
        })}
      </Reveal>

      <Reveal group className="split-row">
        <div className="split-col strengths">
          <h3>En güçlü alanlar</h3>
          <ul>{strengthList}</ul>
        </div>
        <div className="split-col tensions">
          <h3>Yapısal gerilim alanları</h3>
          <ul>{tensionList}</ul>
        </div>
      </Reveal>

      <h2>Sosyolojik Yorum</h2>
      <Reveal group className="card">
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
      </Reveal>

      <h2>Zamanla Değişim</h2>
      <Reveal className="card trend-card">
        {history && history.length >= 2 ? (
          <TrendChart
            history={history.map((h) => ({ ts: new Date(h.created_at).getTime(), rsi: h.score.rsi }))}
          />
        ) : (
          <p className="muted small" style={{ margin: 0 }}>
            Trend için bu testi tekrar çözün.
          </p>
        )}
      </Reveal>

      <Reveal className="disclaimer">
        <span className="eyebrow">{toTurkishUpper("Teşhis değil")}</span>
        <p>
          Bu analiz tanımlayıcıdır. <em>"Toksik", "sağlıksız"</em> gibi etiketler kullanmaz; yalnızca
          yapısal denge, asimetri ve sınırları tanımlar.
        </p>
        <p className="small muted">
          Eşik değerleri (55/75) ve eşit ağırlıklandırma (boyut→endeks, endeks→RSI) ampirik
          araştırmaya değil tasarım kararına dayanır; bu klinik ya da tanısal bir araç değildir.
        </p>
        {test.disclaimerNote && <p className="small muted">{test.disclaimerNote}</p>}
      </Reveal>

      <AppCta variant="compact" />

      <Footer />
    </main>
  );
}

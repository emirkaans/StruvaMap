import { DEFAULT_THRESHOLDS } from "@struva/shared";

export type Band = "good" | "mid" | "low";

export function bandOf(score: number): Band {
  if (score >= DEFAULT_THRESHOLDS.strengthThreshold) return "good";
  if (score >= DEFAULT_THRESHOLDS.tensionThreshold) return "mid";
  return "low";
}

const BAND_HEX: Record<Band, string> = { good: "#4a8a6f", mid: "#c08a3e", low: "#b5654a" };

export function bandHex(score: number): string {
  return BAND_HEX[bandOf(score)];
}

function polar(cx: number, cy: number, radius: number, deg: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
}

export function Donut({
  value,
  size,
  stroke,
  label,
}: {
  value: number;
  size: number;
  stroke: number;
  label: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - v / 100);

  return (
    <svg
      className="donut"
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role="img"
      aria-label={`${label}: ${v} / 100`}
    >
      <circle className="c-track" cx={cx} cy={cy} r={r} fill="none" strokeWidth={stroke} />
      <circle
        className={`c-${bandOf(v)}`}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ.toFixed(2)}
        strokeDashoffset={off.toFixed(2)}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    </svg>
  );
}

const DIM_SHORT: Record<string, string> = {
  decision: "Karar",
  domestic: "Ev İçi",
  mental: "Zihinsel",
  digital: "Dijital",
  social: "Sosyal",
  family: "Aile",
  initiative: "Girişim",
  effort: "Emek",
  emotional: "Duygusal",
  practical: "Pratik",
  honesty: "Dürüstlük",
  autonomy: "Özerklik",
  listening: "Dinleme",
  emotionalLabour: "Duygu",
  practicalSupport: "Destek",
  trust: "Güven",
  privacy: "Mahrem",
  feedback: "Bildirim",
  workload: "İş Yükü",
  recognition: "Takdir",
  boundaries: "Sınır",
};

export function Radar({
  dimensions,
  labels,
}: {
  dimensions: Record<string, number>;
  labels?: Record<string, string>;
}) {
  const keys = Object.keys(dimensions);
  const n = keys.length;
  const W = 520;
  const H = 400;
  const cx = 260;
  const cy = 200;
  const R = 130;
  const labelR = R + 25;

  const grid = [0.25, 0.5, 0.75, 1].map((frac, gi) => {
    const pts = keys
      .map((_, i) => polar(cx, cy, R * frac, i * (360 / n)).map((v) => v.toFixed(1)).join(","))
      .join(" ");
    return <polygon key={gi} className="radar-grid" points={pts} />;
  });

  const axes = keys.map((k, i) => {
    const [x, y] = polar(cx, cy, R, i * (360 / n));
    return <line key={k} className="radar-axis" x1={cx} y1={cy} x2={x.toFixed(1)} y2={y.toFixed(1)} />;
  });

  const valPts: string[] = [];
  const dots = keys.map((k, i) => {
    const [x, y] = polar(cx, cy, R * (dimensions[k] / 100), i * (360 / n));
    valPts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    return <circle key={k} className="radar-dot" cx={x.toFixed(1)} cy={y.toFixed(1)} r={3} />;
  });

  const labelEls = keys.map((k, i) => {
    const [x, y] = polar(cx, cy, labelR, i * (360 / n));
    const dx = x - cx;
    const anchor = Math.abs(dx) < 6 ? "middle" : dx > 0 ? "start" : "end";
    return (
      <text
        key={k}
        className="radar-label"
        x={x.toFixed(1)}
        y={(y + 4).toFixed(1)}
        textAnchor={anchor as "middle" | "start" | "end"}
      >
        {DIM_SHORT[k] ?? labels?.[k] ?? k} <tspan className="radar-val">{dimensions[k]}</tspan>
      </text>
    );
  });

  return (
    <svg className="radar" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Boyut radar grafiği">
      {grid}
      {axes}
      <polygon className="radar-area" points={valPts.join(" ")} />
      {dots}
      {labelEls}
    </svg>
  );
}

export interface TrendPoint {
  ts: number;
  rsi: number;
}

export function TrendChart({ history }: { history: TrendPoint[] }) {
  const W = 340;
  const H = 200;
  const padL = 30;
  const padR = 12;
  const padT = 16;
  const padB = 26;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const n = history.length;

  const pts = history.map((h, i) => {
    const x = padL + (n === 1 ? innerW / 2 : (innerW * i) / (n - 1));
    const y = padT + innerH * (1 - Math.max(0, Math.min(100, h.rsi)) / 100);
    return [x, y] as [number, number];
  });

  const grid = [0, 25, 50, 75, 100].map((v) => {
    const y = padT + innerH * (1 - v / 100);
    return (
      <g key={v}>
        <line className="trend-grid" x1={padL} y1={y.toFixed(1)} x2={W - padR} y2={y.toFixed(1)} />
        <text className="trend-axis" x={padL - 6} y={(y + 3).toFixed(1)} textAnchor="end">
          {v}
        </text>
      </g>
    );
  });

  const step = Math.max(1, Math.ceil(n / 6));
  const xlabels = history.map((h, i) => {
    if (n > 8 && i !== 0 && i !== n - 1 && i % step !== 0) return null;
    const [x] = pts[i];
    const label = new Date(h.ts).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
    return (
      <text key={i} className="trend-axis" x={x.toFixed(1)} y={H - 8} textAnchor="middle">
        {label}
      </text>
    );
  });

  const linePts = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const last = history[history.length - 1].rsi;

  return (
    <svg
      className="trend"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`RSI zaman içinde değişim grafiği, ${n} kayıt, son değer ${last}`}
    >
      {grid}
      <polyline className="trend-line" points={linePts} fill="none" />
      {pts.map((p, i) => (
        <circle key={i} className="trend-dot" cx={p[0].toFixed(1)} cy={p[1].toFixed(1)} r={3} />
      ))}
      {xlabels}
    </svg>
  );
}

export function Bar({ name, score }: { name: string; score: number }) {
  return (
    <div className="bar-row">
      <div className="bar-head">
        <span>{name}</span>
        <span className="val">{score}</span>
      </div>
      <div className={`bar ${bandOf(score)}`}>
        <span style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

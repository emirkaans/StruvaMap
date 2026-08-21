export interface CountPoint {
  date: string;
  count: number;
}

/* TrendChart (components/charts.tsx) 0-100 RSI skalasına ve skor renk
   bantlarına bağlı — ham olay sayacı için o bileşeni değil, aynı .trend-*
   CSS sınıflarını (jenerik, skorla ilgisi yok) yeniden kullanan bu küçük
   bileşeni kullanıyoruz. */
export function AdminTrendChart({ data }: { data: CountPoint[] }) {
  const W = 640;
  const H = 220;
  const padL = 34;
  const padR = 12;
  const padT = 16;
  const padB = 26;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const n = data.length;
  const max = Math.max(1, ...data.map((d) => d.count));

  const pts = data.map((d, i) => {
    const x = padL + (n === 1 ? innerW / 2 : (innerW * i) / (n - 1));
    const y = padT + innerH * (1 - d.count / max);
    return [x, y] as [number, number];
  });

  const gridFractions = [0, 0.25, 0.5, 0.75, 1];
  const grid = gridFractions.map((frac) => {
    const y = padT + innerH * (1 - frac);
    return (
      <g key={frac}>
        <line className="trend-grid" x1={padL} y1={y.toFixed(1)} x2={W - padR} y2={y.toFixed(1)} />
        <text className="trend-axis" x={padL - 6} y={(y + 3).toFixed(1)} textAnchor="end">
          {Math.round(max * frac)}
        </text>
      </g>
    );
  });

  const step = Math.max(1, Math.ceil(n / 8));
  const xlabels = data.map((d, i) => {
    if (n > 10 && i !== 0 && i !== n - 1 && i % step !== 0) return null;
    const [x] = pts[i];
    const label = new Date(d.date).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
    return (
      <text key={i} className="trend-axis" x={x.toFixed(1)} y={H - 8} textAnchor="middle">
        {label}
      </text>
    );
  });

  const linePts = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");

  if (n === 0) {
    return <p className="muted small" style={{ margin: 0 }}>Bu aralıkta veri yok.</p>;
  }

  return (
    <svg
      className="trend"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Günlük olay sayısı grafiği, ${n} gün`}
      style={{ maxWidth: "100%" }}
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

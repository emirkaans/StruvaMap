import { useEffect, useState, type MouseEvent } from "react";

// Panelde anlamlı en eski yıl; daha eskisi büyük ihtimalle yarım yazılmış bir
// yıldır ("0003"), API'ye gönderilmez.
const MIN_YEAR = 2024;

function isoDate(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return isoDate(d);
}

interface Preset {
  label: string;
  from: string;
  to: string;
}

function presets(): Preset[] {
  const now = new Date();
  const today = isoDate(now);
  return [
    { label: "Bugün", from: today, to: today },
    { label: "Son 7 gün", from: daysAgo(6), to: today },
    { label: "Son 30 gün", from: daysAgo(29), to: today },
    { label: "Bu ay", from: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)), to: today },
    {
      label: "Geçen ay",
      from: isoDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      to: isoDate(new Date(now.getFullYear(), now.getMonth(), 0)),
    },
    { label: "Tüm zamanlar", from: "", to: "" },
  ];
}

// Tarih kutusu yıl yazılırken her tuşta değişir ("0003-10-02" gibi); yalnızca
// makul bir yıl içeren değer kabul edilir.
function isUsable(value: string): boolean {
  if (!value) return true;
  const year = Number(value.slice(0, 4));
  return year >= MIN_YEAR && year <= new Date().getFullYear() + 1;
}

// Kutunun herhangi bir yerine tıklayınca takvim açılsın; klavyeyle yazmak
// yine mümkün. showPicker desteklenmeyen tarayıcıda sessizce geçilir.
function openPicker(e: MouseEvent<HTMLInputElement>) {
  try {
    e.currentTarget.showPicker();
  } catch {
    // eski tarayıcı ya da kullanıcı etkileşimi sayılmayan durum
  }
}

/* Admin sayfalarında ortak tarih aralığı seçimi: tek tıkla hazır dönemler,
   gerekirse elle başlangıç/bitiş. Değer, ancak geçerli ve sıralı olduğunda
   üst bileşene iletilir; yarım yazılmış tarihlerle istek atılmaz. */
export function AdminDateRange({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);

  useEffect(() => {
    setDraftFrom(from);
    setDraftTo(to);
  }, [from, to]);

  const options = presets();
  const today = options[0].to;
  const active = options.find((p) => p.from === from && p.to === to);

  const badYear = !isUsable(draftFrom) || !isUsable(draftTo);
  const badOrder = Boolean(draftFrom && draftTo && draftFrom > draftTo);

  function update(nextFrom: string, nextTo: string) {
    setDraftFrom(nextFrom);
    setDraftTo(nextTo);
    if (isUsable(nextFrom) && isUsable(nextTo) && !(nextFrom && nextTo && nextFrom > nextTo)) {
      onChange(nextFrom, nextTo);
    }
  }

  return (
    <div className="admin-date-range">
      <div className="admin-presets">
        {options.map((p) => (
          <button
            key={p.label}
            type="button"
            className={`admin-preset${active === p ? " active" : ""}`}
            onClick={() => update(p.from, p.to)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="admin-filters">
        <label className="admin-field">
          <span>Başlangıç</span>
          <input
            type="date"
            className="admin-input"
            value={draftFrom}
            min={`${MIN_YEAR}-01-01`}
            max={today}
            onClick={openPicker}
            onChange={(e) => update(e.target.value, draftTo)}
          />
        </label>
        <label className="admin-field">
          <span>Bitiş</span>
          <input
            type="date"
            className="admin-input"
            value={draftTo}
            min={`${MIN_YEAR}-01-01`}
            max={today}
            onClick={openPicker}
            onChange={(e) => update(draftFrom, e.target.value)}
          />
        </label>
      </div>
      {badYear && (
        <p className="admin-error">
          Yıl {MIN_YEAR} ile {new Date().getFullYear() + 1} arasında olmalı.
        </p>
      )}
      {!badYear && badOrder && <p className="admin-error">Başlangıç tarihi bitişten sonra olamaz.</p>}
    </div>
  );
}

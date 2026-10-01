import { useEffect, useState } from "react";
import { AdminNav } from "../../components/AdminRoute";
import { fetchAdminMobile, type AdminMobileSummary } from "../../lib/api";

const SOURCE_LABELS: Record<string, string> = {
  app: "Uygulama içi",
  notification: "Bildirimden",
  widget: "Ana ekran widget'ı",
};

function percent(part: number, whole: number): string {
  return whole > 0 ? `%${Math.round((part / whole) * 100)}` : "–";
}

// "2026-09-01" → "1 Eyl"; yıl bu yıl değilse eklenir ("1 Eyl 2025").
function shortDate(value: string): string {
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    ...(y !== new Date().getFullYear() ? { year: "numeric" } : {}),
  });
}

// Etiketlerin başına gelen dönem: "1 Eyl - 30 Eyl arası", "1 Eyl sonrası",
// "30 Eyl öncesi" ya da tarih seçilmemişse "Tüm zamanlarda".
function rangeLabel(from: string, to: string): string {
  if (from && to) return `${shortDate(from)} - ${shortDate(to)} arası`;
  if (from) return `${shortDate(from)} sonrası`;
  if (to) return `${shortDate(to)} öncesi`;
  return "Tüm zamanlarda";
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="admin-stat-tile">
      <span className="admin-stat-value">{value}</span>
      <span className="admin-stat-label">{label}</span>
    </div>
  );
}

/* Android uygulamasının kullanıcı, nabız ve bildirim göstergeleri. Tarih
   aralığı yeni kullanıcı, sonlanan eşleşme, nabız günleri ve cevap
   kaynaklarına uygulanır; toplamlar ve aktif oturumlar aralıktan bağımsızdır. */
export function AdminMobilePage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<AdminMobileSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    // Bitiş günü de dahil olsun diye günün sonuna çekilir.
    fetchAdminMobile(from || undefined, to ? `${to}T23:59:59` : undefined)
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Yüklenemedi."));
  }, [from, to]);

  const pulse = data?.pulse;
  const sources = pulse ? Object.entries(pulse.answerSources).sort(([, a], [, b]) => b - a) : [];
  const sourceTotal = sources.reduce((sum, [, n]) => sum + n, 0);
  const range = rangeLabel(from, to);

  return (
    <main className="wrap admin-wrap">
      <AdminNav />
      <h1>Mobil</h1>

      <div className="admin-filters">
        <label className="admin-field">
          <span>Başlangıç</span>
          <input type="date" className="admin-input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="admin-field">
          <span>Bitiş</span>
          <input type="date" className="admin-input" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
      </div>

      {error && <p className="small" style={{ color: "var(--bad)" }}>{error}</p>}
      {!data && !error && <p className="muted small">Yükleniyor…</p>}

      {data && pulse && (
        <>
          <h2>Kullanıcılar</h2>
          <div className="admin-stat-grid">
            <Stat value={data.users.total} label="Toplam hesap" />
            <Stat value={data.users.registered} label="Kayıtlı" />
            <Stat value={data.users.guests} label="Misafir" />
            <Stat value={data.users.newInRange} label={`${range} yeni hesap`} />
            <Stat value={data.users.newGuestsInRange} label={`${range} yeni misafir`} />
          </div>

          <h2>Aktif oturumlar</h2>
          <div className="admin-stat-grid">
            <Stat value={data.activeSessions.last7Days} label="Son 7 gün" />
            <Stat value={data.activeSessions.last30Days} label="Son 30 gün" />
          </div>
          <p className="muted small">
            Uygulamadan en az bir olay gönderen farklı cihaz sayısı. Platform bilgisi olaylara sonradan eklendi;
            o tarihten önceki kullanım sayılmaz.
          </p>

          <h2>Günlük nabız</h2>
          <div className="admin-stat-grid">
            <Stat value={pulse.activePairs} label="Aktif eşleşme" />
            <Stat value={pulse.pendingPairs} label="Bekleyen davet" />
            <Stat value={pulse.endedPairs} label="Sonlanan eşleşme" />
            <Stat value={pulse.endedInRange} label={`${range} sonlanan`} />
          </div>
          <div className="card">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{range} nabız günleri</th>
                  <th>Sayı</th>
                  <th>Oran</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Soru üretilen gün (eşleşme başına)</td>
                  <td>{pulse.checkinDays}</td>
                  <td>–</td>
                </tr>
                <tr>
                  <td>En az bir tarafın cevapladığı</td>
                  <td>{pulse.anyAnsweredDays}</td>
                  <td>{percent(pulse.anyAnsweredDays, pulse.checkinDays)}</td>
                </tr>
                <tr>
                  <td>İki tarafın da cevapladığı</td>
                  <td>{pulse.bothAnsweredDays}</td>
                  <td>{percent(pulse.bothAnsweredDays, pulse.checkinDays)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>Cevap nereden geldi</h3>
          <div className="card">
            {sources.length ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Kaynak</th>
                    <th>Cevap</th>
                    <th>Pay</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map(([source, n]) => (
                    <tr key={source}>
                      <td>{SOURCE_LABELS[source] ?? source}</td>
                      <td>{n}</td>
                      <td>{percent(n, sourceTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="muted small" style={{ margin: 0 }}>
                {range} nabız cevabı yok.
              </p>
            )}
          </div>

          <h2>Özellik kullanımı</h2>
          <div className="card">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Özellik</th>
                  <th>Gösterge</th>
                  <th>Değer</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td rowSpan={4}>İlişki haritası</td>
                  <td>Oluşturulan ilişki</td>
                  <td>{data.features.relationships.total}</td>
                </tr>
                <tr>
                  <td>Arşivlenen ilişki</td>
                  <td>{data.features.relationships.archived}</td>
                </tr>
                <tr>
                  <td>En az bir ilişkisi olan kullanıcı</td>
                  <td>{data.features.relationships.users}</td>
                </tr>
                <tr>
                  <td>İlişkiye bağlı sonuç</td>
                  <td>{data.features.relationships.linkedResults}</td>
                </tr>
                <tr>
                  <td rowSpan={3}>Tahmin modu</td>
                  <td>Kaydedilen tahmin</td>
                  <td>{data.features.predictions.total}</td>
                </tr>
                <tr>
                  <td>Kıyaslaması oluşan tahmin</td>
                  <td>{data.features.predictions.evaluated}</td>
                </tr>
                <tr>
                  <td>Ortalama isabet</td>
                  <td>
                    {data.features.predictions.averageAccuracy == null
                      ? "–"
                      : `%${data.features.predictions.averageAccuracy}`}
                  </td>
                </tr>
                <tr>
                  <td rowSpan={2}>Emek defteri</td>
                  <td>{range} kayıt</td>
                  <td>{data.features.labour.entriesInRange}</td>
                </tr>
                <tr>
                  <td>{range} kayıt giren eşleşme</td>
                  <td>{data.features.labour.pairsInRange}</td>
                </tr>
                <tr>
                  <td rowSpan={2}>Webden uygulamaya aktarma</td>
                  <td>{range} oluşturulan kod</td>
                  <td>{data.features.claims.createdInRange}</td>
                </tr>
                <tr>
                  <td>{range} uygulamada kullanılan kod</td>
                  <td>
                    {data.features.claims.redeemedInRange} (
                    {percent(data.features.claims.redeemedInRange, data.features.claims.createdInRange)})
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>Bildirimler</h2>
          <div className="admin-stat-grid">
            <Stat value={data.push.usersWithToken} label="Bildirim alabilen kullanıcı" />
          </div>
          <div className="card">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Gün</th>
                  <th>Sabah bildirimi giden eşleşme</th>
                  <th>Akşam hatırlatması giden kişi</th>
                </tr>
              </thead>
              <tbody>
                {data.push.days.map((day) => (
                  <tr key={day.date}>
                    <td>{day.date}</td>
                    <td>{day.morningPairs}</td>
                    <td>{day.eveningPeople}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="muted small" style={{ margin: "12px 0 0" }}>
              Sabah bildirimi 11:00'de aktif eşleşmelere, akşam hatırlatması 19:00'da o gün cevap vermeyenlere gider
              (İstanbul saati). Aktif eşleşme varken bir günün sabah sütunu 0 ise zamanlanmış görev o gün çalışmamış
              olabilir.
            </p>
          </div>
        </>
      )}
    </main>
  );
}

import { useEffect, useState } from "react";
import { AdminNav } from "../../components/AdminRoute";
import { AdminDateRange } from "../../components/AdminDateRange";
import { AdminTrendChart } from "../../components/AdminTrendChart";
import {
  fetchAdminEventsFunnel,
  fetchAdminEventsTrend,
  type AdminEventDailyCount,
  type AdminFunnelStep,
  type AdminPlatform,
} from "../../lib/api";
import { AdminPlatformSelect } from "../../components/AdminPlatformSelect";

// Bitiş günü de dahil olsun diye günün sonuna çekilir.
function endOfDay(date: string): string | undefined {
  return date ? `${date}T23:59:59` : undefined;
}

export function AdminEventsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [platform, setPlatform] = useState<AdminPlatform>("");
  const [funnel, setFunnel] = useState<AdminFunnelStep[] | null>(null);
  const [selectedName, setSelectedName] = useState<string>("");
  const [trend, setTrend] = useState<AdminEventDailyCount[] | null>(null);

  useEffect(() => {
    fetchAdminEventsFunnel(from || undefined, endOfDay(to), platform).then((rows) => {
      setFunnel(rows);
      setSelectedName((current) => current || rows[0]?.name || "");
    });
  }, [from, to, platform]);

  useEffect(() => {
    if (!selectedName) return;
    fetchAdminEventsTrend(selectedName, from || undefined, endOfDay(to), platform).then(setTrend);
  }, [selectedName, from, to, platform]);

  // Oranlar tekil oturumla: aynı kişinin tekrar eden olayları oranı şişirmesin.
  const first = funnel?.[0]?.sessions ?? 0;

  return (
    <main className="wrap admin-wrap">
      <AdminNav />
      <h1>Olaylar</h1>

      <AdminDateRange
        from={from}
        to={to}
        onChange={(nextFrom, nextTo) => {
          setFrom(nextFrom);
          setTo(nextTo);
        }}
      />
      <div className="admin-filters">
        <AdminPlatformSelect value={platform} onChange={setPlatform} />
      </div>

      <h2>Huni</h2>
      <div className="card">
        {funnel ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Adım</th>
                <th>Olay</th>
                <th>Tekil oturum</th>
                <th>Önceki adıma göre</th>
                <th>İlk adıma göre</th>
              </tr>
            </thead>
            <tbody>
              {funnel.map((step, i) => {
                const prev = funnel[i - 1]?.sessions ?? step.sessions;
                const ofPrev = prev > 0 ? Math.round((step.sessions / prev) * 100) : 100;
                const ofFirst = first > 0 ? Math.round((step.sessions / first) * 100) : 100;
                return (
                  <tr key={step.name}>
                    <td>{step.name}</td>
                    <td>{step.count}</td>
                    <td>{step.sessions}</td>
                    <td>{i === 0 ? "—" : `%${ofPrev}`}</td>
                    <td>%{ofFirst}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="muted small" style={{ margin: 0 }}>
            Yükleniyor…
          </p>
        )}
      </div>

      <h2>Günlük eğilim</h2>
      <div className="card">
        <label className="admin-field admin-field-inline">
          <span>Olay</span>
          <select
            className="admin-input"
            value={selectedName}
            onChange={(e) => setSelectedName(e.target.value)}
          >
            {funnel?.map((step) => (
              <option key={step.name} value={step.name}>
                {step.name}
              </option>
            ))}
          </select>
        </label>
        {trend && <AdminTrendChart data={trend} />}
      </div>
    </main>
  );
}

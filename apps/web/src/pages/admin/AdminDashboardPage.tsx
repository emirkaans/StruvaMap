import { useEffect, useState } from "react";
import type { TestDefinition } from "@struva/shared";
import { AdminNav } from "../../components/AdminRoute";
import { AdminTrendChart, type CountPoint } from "../../components/AdminTrendChart";
import {
  fetchAdminComparisons,
  fetchAdminComparisonsDailyTotal,
  fetchAdminEventsDailyTotal,
  fetchAdminEventsSummary,
  fetchAdminResults,
  fetchAdminResultsByTest,
  fetchAdminResultsDailyTotal,
  fetchTests,
  type AdminTestResultCount,
} from "../../lib/api";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const TREND_RANGES = {
  "7d": { label: "Son 7 gün", days: 7 },
  "30d": { label: "Son 1 ay", days: 30 },
  all: { label: "Tüm zamanlar", days: null },
} as const;

type TrendRangeKey = keyof typeof TREND_RANGES;

function trendRangeFrom(key: TrendRangeKey): string | undefined {
  const days = TREND_RANGES[key].days;
  if (days == null) return undefined;
  const d = new Date();
  d.setDate(d.getDate() - (days - 1));
  return isoDate(d);
}

export function AdminDashboardPage() {
  const [resultsTotal, setResultsTotal] = useState<number | null>(null);
  const [comparisonsTotal, setComparisonsTotal] = useState<number | null>(null);
  const [eventsTotal, setEventsTotal] = useState<number | null>(null);
  const [resultsByTest, setResultsByTest] = useState<AdminTestResultCount[] | null>(null);
  const [tests, setTests] = useState<TestDefinition[]>([]);
  const [trendRange, setTrendRange] = useState<TrendRangeKey>("7d");
  const [eventsTrend, setEventsTrend] = useState<CountPoint[] | null>(null);
  const [resultsTrend, setResultsTrend] = useState<CountPoint[] | null>(null);
  const [comparisonsTrend, setComparisonsTrend] = useState<CountPoint[] | null>(null);

  useEffect(() => {
    fetchAdminResults({ page: 1, pageSize: 1 }).then((r) => setResultsTotal(r.total));
    fetchAdminComparisons({ page: 1, pageSize: 1 }).then((r) => setComparisonsTotal(r.total));
    fetchAdminEventsSummary().then((rows) => setEventsTotal(rows.reduce((sum, r) => sum + r.count, 0)));
    fetchAdminResultsByTest().then((rows) => setResultsByTest([...rows].sort((a, b) => b.count - a.count)));
    fetchTests().then(setTests);
  }, []);

  useEffect(() => {
    const from = trendRangeFrom(trendRange);
    setEventsTrend(null);
    setResultsTrend(null);
    setComparisonsTrend(null);
    fetchAdminEventsDailyTotal(from).then(setEventsTrend);
    fetchAdminResultsDailyTotal(from).then(setResultsTrend);
    fetchAdminComparisonsDailyTotal(from).then(setComparisonsTrend);
  }, [trendRange]);

  const testName = (testId: string) => tests.find((t) => t.id === testId)?.name ?? testId;
  const maxTestCount = resultsByTest?.length ? Math.max(...resultsByTest.map((r) => r.count), 1) : 1;

  return (
    <main className="wrap admin-wrap">
      <AdminNav />
      <h1>Özet</h1>
      <div className="admin-stat-grid">
        <div className="admin-stat-tile">
          <span className="admin-stat-value">{resultsTotal ?? "…"}</span>
          <span className="admin-stat-label">Toplam sonuç</span>
        </div>
        <div className="admin-stat-tile">
          <span className="admin-stat-value">{comparisonsTotal ?? "…"}</span>
          <span className="admin-stat-label">Toplam kıyaslama</span>
        </div>
        <div className="admin-stat-tile">
          <span className="admin-stat-value">{eventsTotal ?? "…"}</span>
          <span className="admin-stat-label">Toplam olay</span>
        </div>
      </div>

      <h2>Teste Göre Sonuçlar</h2>
      <div className="card">
        {resultsByTest ? (
          resultsByTest.length ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Test</th>
                  <th>Sonuç sayısı</th>
                </tr>
              </thead>
              <tbody>
                {resultsByTest.map((r) => (
                  <tr key={r.testId}>
                    <td>{testName(r.testId)}</td>
                    <td>
                      <div className="bar-row">
                        <div className="bar-head">
                          <span className="val">{r.count}</span>
                        </div>
                        <div className="bar good">
                          <span style={{ width: `${(r.count / maxTestCount) * 100}%` }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted small" style={{ margin: 0 }}>
              Henüz sonuç yok.
            </p>
          )
        ) : (
          <p className="muted small" style={{ margin: 0 }}>
            Yükleniyor…
          </p>
        )}
      </div>

      <div className="admin-field-inline" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>Zaman Bazlı Grafikler</h2>
        <select
          className="admin-input"
          value={trendRange}
          onChange={(e) => setTrendRange(e.target.value as TrendRangeKey)}
        >
          {(Object.entries(TREND_RANGES) as [TrendRangeKey, (typeof TREND_RANGES)[TrendRangeKey]][]).map(
            ([key, range]) => (
              <option key={key} value={key}>
                {range.label}
              </option>
            ),
          )}
        </select>
      </div>

      <h3>Olaylar</h3>
      <div className="card">{eventsTrend && <AdminTrendChart data={eventsTrend} label="olay" />}</div>

      <h3>Tamamlanan Testler</h3>
      <div className="card">{resultsTrend && <AdminTrendChart data={resultsTrend} label="sonuç" />}</div>

      <h3>Kıyaslamalar</h3>
      <div className="card">{comparisonsTrend && <AdminTrendChart data={comparisonsTrend} label="kıyaslama" />}</div>
    </main>
  );
}

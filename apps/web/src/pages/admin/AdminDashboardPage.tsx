import { useEffect, useState } from "react";
import type { TestDefinition } from "@struva/shared";
import { AdminNav } from "../../components/AdminRoute";
import { AdminTrendChart, type CountPoint } from "../../components/AdminTrendChart";
import {
  fetchAdminComparisons,
  fetchAdminEventsDailyTotal,
  fetchAdminEventsSummary,
  fetchAdminResults,
  fetchAdminResultsByTest,
  fetchTests,
  type AdminTestResultCount,
} from "../../lib/api";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function last7DaysFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return isoDate(d);
}

export function AdminDashboardPage() {
  const [resultsTotal, setResultsTotal] = useState<number | null>(null);
  const [comparisonsTotal, setComparisonsTotal] = useState<number | null>(null);
  const [eventsTotal, setEventsTotal] = useState<number | null>(null);
  const [resultsByTest, setResultsByTest] = useState<AdminTestResultCount[] | null>(null);
  const [tests, setTests] = useState<TestDefinition[]>([]);
  const [weekTrend, setWeekTrend] = useState<CountPoint[] | null>(null);

  useEffect(() => {
    fetchAdminResults({ page: 1, pageSize: 1 }).then((r) => setResultsTotal(r.total));
    fetchAdminComparisons({ page: 1, pageSize: 1 }).then((r) => setComparisonsTotal(r.total));
    fetchAdminEventsSummary().then((rows) => setEventsTotal(rows.reduce((sum, r) => sum + r.count, 0)));
    fetchAdminResultsByTest().then((rows) => setResultsByTest([...rows].sort((a, b) => b.count - a.count)));
    fetchTests().then(setTests);
    fetchAdminEventsDailyTotal(last7DaysFrom()).then(setWeekTrend);
  }, []);

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

      <h2>Son 7 Gün</h2>
      <div className="card">{weekTrend && <AdminTrendChart data={weekTrend} />}</div>
    </main>
  );
}

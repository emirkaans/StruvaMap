import { useEffect, useState } from "react";
import { AdminNav } from "../../components/AdminRoute";
import { fetchAdminComparisons, fetchAdminEventsSummary, fetchAdminResults } from "../../lib/api";

export function AdminDashboardPage() {
  const [resultsTotal, setResultsTotal] = useState<number | null>(null);
  const [comparisonsTotal, setComparisonsTotal] = useState<number | null>(null);
  const [eventsTotal, setEventsTotal] = useState<number | null>(null);

  useEffect(() => {
    fetchAdminResults({ page: 1, pageSize: 1 }).then((r) => setResultsTotal(r.total));
    fetchAdminComparisons({ page: 1, pageSize: 1 }).then((r) => setComparisonsTotal(r.total));
    fetchAdminEventsSummary().then((rows) => setEventsTotal(rows.reduce((sum, r) => sum + r.count, 0)));
  }, []);

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
    </main>
  );
}

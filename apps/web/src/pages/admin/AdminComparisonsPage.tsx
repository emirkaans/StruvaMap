import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { TestDefinition } from "@struva/shared";
import { AdminNav } from "../../components/AdminRoute";
import { fetchAdminComparisons, fetchTests, type AdminComparisonRow } from "../../lib/api";

const PAGE_SIZE = 20;

function shortId(id: string): string {
  return id.slice(0, 8);
}

export function AdminComparisonsPage() {
  const [tests, setTests] = useState<TestDefinition[]>([]);
  const [testId, setTestId] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AdminComparisonRow[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchTests().then(setTests);
  }, []);

  useEffect(() => {
    fetchAdminComparisons({ page, pageSize: PAGE_SIZE, testId: testId || undefined }).then((res) => {
      setRows(res.rows);
      setTotal(res.total);
    });
  }, [page, testId]);

  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="wrap admin-wrap">
      <AdminNav />
      <h1>Kıyaslamalar</h1>

      <div className="admin-filters">
        <label className="admin-field admin-field-inline">
          <span>Test</span>
          <select
            className="admin-input"
            value={testId}
            onChange={(e) => {
              setTestId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tümü</option>
            {tests.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Test</th>
              <th>Sonuç A</th>
              <th>Sonuç B</th>
              <th>Tarih</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link to={`/comparisons/${c.id}`}>{shortId(c.id)}</Link>
                </td>
                <td>{c.test_id}</td>
                <td>
                  <Link to={`/result/${c.result_id_a}`}>{shortId(c.result_id_a)}</Link>
                </td>
                <td>
                  <Link to={`/result/${c.result_id_b}`}>{shortId(c.result_id_b)}</Link>
                </td>
                <td>{new Date(c.created_at).toLocaleString("tr-TR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="muted small" style={{ margin: "12px 0 0" }}>
            Kayıt yok.
          </p>
        )}
      </div>

      <div className="admin-pagination">
        <button type="button" className="btn secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Önceki
        </button>
        <span className="small muted">
          Sayfa {page} / {lastPage} ({total} kayıt)
        </span>
        <button
          type="button"
          className="btn secondary"
          disabled={page >= lastPage}
          onClick={() => setPage((p) => p + 1)}
        >
          Sonraki
        </button>
      </div>
    </main>
  );
}

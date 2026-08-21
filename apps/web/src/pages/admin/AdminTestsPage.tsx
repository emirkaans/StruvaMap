import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { TestDefinition } from "@struva/shared";
import { AdminNav } from "../../components/AdminRoute";
import { fetchTests } from "../../lib/api";

export function AdminTestsPage() {
  const [tests, setTests] = useState<TestDefinition[] | null>(null);

  useEffect(() => {
    fetchTests().then(setTests);
  }, []);

  return (
    <main className="wrap admin-wrap">
      <AdminNav />
      <h1>Testler</h1>

      <div className="card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Test</th>
              <th>Alt başlık</th>
              <th>Soru sayısı</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tests?.map((t) => (
              <tr key={t.id}>
                <td>{t.name}</td>
                <td>{t.subtitle}</td>
                <td>{t.questions.length}</td>
                <td>
                  <Link to={`/admin/tests/${t.id}`} className="btn secondary">
                    Düzenle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!tests && (
          <p className="muted small" style={{ margin: "12px 0 0" }}>
            Yükleniyor…
          </p>
        )}
      </div>
    </main>
  );
}

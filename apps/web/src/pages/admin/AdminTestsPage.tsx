import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { TestDefinition } from "@struva/shared";
import { AdminNav } from "../../components/AdminRoute";
import { fetchTests, updateAdminTest } from "../../lib/api";

export function AdminTestsPage() {
  const [tests, setTests] = useState<TestDefinition[] | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTests(true).then(setTests);
  }, []);

  // visible === false olan test web'de ve uygulamada listelenmez; alan yoksa yayında sayılır.
  async function toggleVisible(test: TestDefinition) {
    const publish = test.visible === false;
    const verb = publish ? "yayına almak" : "gizlemek";
    if (!window.confirm(`"${test.name}" testini ${verb} istediğine emin misin?`)) return;
    setSavingId(test.id);
    setError(null);
    try {
      const saved = await updateAdminTest(test.id, { ...test, visible: publish });
      setTests((current) => current?.map((t) => (t.id === saved.id ? saved : t)) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaydedilemedi.");
    } finally {
      setSavingId(null);
    }
  }

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
              <th>Durum</th>
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
                  {t.visible === false ? "Gizli" : "Yayında"}{" "}
                  <button
                    type="button"
                    className="btn secondary"
                    disabled={savingId === t.id}
                    onClick={() => toggleVisible(t)}
                  >
                    {t.visible === false ? "Yayına al" : "Gizle"}
                  </button>
                </td>
                <td>
                  <Link to={`/admin/tests/${t.id}`} className="btn secondary">
                    Düzenle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {error && (
          <p className="small" style={{ margin: "12px 0 0", color: "var(--bad)" }}>
            {error}
          </p>
        )}
        {!tests && (
          <p className="muted small" style={{ margin: "12px 0 0" }}>
            Yükleniyor…
          </p>
        )}
      </div>
    </main>
  );
}

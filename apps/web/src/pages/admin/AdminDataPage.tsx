import { useState, type FormEvent } from "react";
import { AdminNav } from "../../components/AdminRoute";
import {
  deleteAdminSessionData,
  lookupAdminData,
  type AdminDataLookup,
  type AdminDeletionReport,
  type AdminSessionData,
} from "../../lib/api";

/* Kişisel veri silme talepleri: kullanıcı sonuç ya da davet bağlantısını
   gönderir, buradan o cihazın (oturumun) tüm sonuçları, bunlara bağlı
   kıyaslamalar ve olay kayıtları kalıcı olarak silinir. */
export function AdminDataPage() {
  const [query, setQuery] = useState("");
  const [lookup, setLookup] = useState<AdminDataLookup | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState<Record<string, AdminDeletionReport>>({});

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setLookup(null);
    setDeleted({});
    try {
      setLookup(await lookupAdminData(query.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Aranamadı.");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(session: AdminSessionData) {
    const confirmed = window.confirm(
      `Bu oturumun ${session.results.length} sonucu, ${session.comparisonCount} kıyaslaması ve ` +
        `${session.eventCount} olay kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam edilsin mi?`,
    );
    if (!confirmed) return;
    setError(null);
    try {
      const report = await deleteAdminSessionData(session.sessionId);
      setDeleted((current) => ({ ...current, [session.sessionId]: report }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Silinemedi.");
    }
  }

  return (
    <main className="wrap admin-wrap">
      <AdminNav />
      <h1>Veri silme</h1>
      <p className="muted small">
        Silme talebiyle gelen sonuç, kıyaslama ya da davet bağlantısını yapıştır. Bağlantıdaki sonucun ait olduğu
        cihazın tüm sonuçları, bu sonuçlara bağlı kıyaslamalar ve olay kayıtları silinir. Kıyaslama bağlantısında iki
        kişinin cihazı ayrı ayrı listelenir; yalnızca talep edenin verisini sil.
      </p>

      <form className="admin-filters" onSubmit={onSearch}>
        <label className="admin-field" style={{ flex: 1 }}>
          <span>Bağlantı ya da kimlik</span>
          <input
            className="admin-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="https://struvamap.com/result/…"
          />
        </label>
        <button type="submit" className="btn" disabled={loading || !query.trim()}>
          {loading ? "Aranıyor…" : "Bul"}
        </button>
      </form>

      {error && <p className="small" style={{ color: "var(--bad)" }}>{error}</p>}

      {lookup?.sessions.map((session, i) => {
        const report = deleted[session.sessionId];
        return (
          <div className="card" key={session.sessionId} style={{ marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>
              {lookup.matchedAs === "comparison" ? `${i + 1}. kişinin cihazı` : "Cihaz"}
            </h3>
            <p className="muted small">Oturum: {session.sessionId}</p>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sonuç</th>
                  <th>Test</th>
                  <th>Tarih</th>
                  <th>Mobil hesap</th>
                </tr>
              </thead>
              <tbody>
                {session.results.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id.slice(0, 8)}</td>
                    <td>{r.testId}</td>
                    <td>{new Date(r.createdAt).toLocaleString("tr-TR")}</td>
                    <td>{r.linkedToAccount ? "Evet" : "Hayır"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="small">
              {session.results.length} sonuç · {session.comparisonCount} kıyaslama · {session.eventCount} olay kaydı
            </p>
            {session.results.some((r) => r.linkedToAccount) && (
              <p className="muted small">
                Bu cihazın bir mobil hesabı var. Hesabın kendisi burada silinmez; kullanıcı uygulamadaki "Hesabı sil"
                seçeneğini kullanabilir.
              </p>
            )}
            {report ? (
              <p className="small">
                Silindi: {report.results} sonuç, {report.comparisons} kıyaslama, {report.events} olay kaydı.
              </p>
            ) : (
              <button type="button" className="btn secondary" onClick={() => onDelete(session)}>
                Bu cihazın verisini sil
              </button>
            )}
          </div>
        );
      })}
    </main>
  );
}

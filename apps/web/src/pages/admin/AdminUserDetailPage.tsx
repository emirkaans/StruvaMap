import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { TestDefinition } from "@struva/shared";
import { AdminNav } from "../../components/AdminRoute";
import { fetchAdminUser, fetchTests, type AdminUserDetail } from "../../lib/api";
import { PULSE_LABELS, userDisplayName } from "./AdminUsersPage";

function formatDateTime(value: string | null): string {
  return value ? new Date(value).toLocaleString("tr-TR") : "–";
}

function percent(part: number, whole: number): string {
  return whole > 0 ? `%${Math.round((part / whole) * 100)}` : "–";
}

/* Tek hesabın özeti. İlişki adları, notlar ve nabız cevaplarının içeriği
   uygulamada "yalnızca sen görürsün" diye sunulduğu için burada yalnızca
   sayıları gösterilir. */
export function AdminUserDetailPage() {
  const { userId = "" } = useParams();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [tests, setTests] = useState<TestDefinition[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTests(true).then(setTests);
  }, []);

  useEffect(() => {
    setUser(null);
    setError(null);
    fetchAdminUser(userId)
      .then(setUser)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Yüklenemedi."));
  }, [userId]);

  const testName = (id: string) => tests.find((t) => t.id === id)?.name ?? id;

  return (
    <main className="wrap admin-wrap">
      <AdminNav />
      <p className="small">
        <Link to="/admin/users">← Kullanıcılar</Link>
      </p>

      {error && <p className="admin-error">{error}</p>}
      {!user && !error && <p className="muted small">Yükleniyor…</p>}

      {user && (
        <>
          <h1>{userDisplayName(user)}</h1>
          <p className="muted small">Kimlik: {user.id}</p>

          <div className="admin-stat-grid">
            <div className="admin-stat-tile">
              <span className="admin-stat-value">{user.guest ? "Misafir" : "Kayıtlı"}</span>
              <span className="admin-stat-label">Hesap türü</span>
            </div>
            <div className="admin-stat-tile">
              <span className="admin-stat-value">{user.resultCount}</span>
              <span className="admin-stat-label">Çözülen test</span>
            </div>
            <div className="admin-stat-tile">
              <span className="admin-stat-value">{user.hasPushToken ? "Açık" : "Kapalı"}</span>
              <span className="admin-stat-label">Bildirim</span>
            </div>
          </div>
          <p className="muted small">
            Kayıt: {formatDateTime(user.createdAt)} · Son giriş: {formatDateTime(user.lastSignInAt)}
          </p>

          <h2>Sonuçlar</h2>
          <div className="card">
            {user.results.length ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Sonuç</th>
                    <th>Test</th>
                    <th>Skor</th>
                    <th>Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {user.results.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <Link to={`/result/${r.id}`}>{r.id.slice(0, 8)}</Link>
                      </td>
                      <td>{testName(r.testId)}</td>
                      <td>{r.rsi ?? "–"}</td>
                      <td>{formatDateTime(r.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="muted small" style={{ margin: 0 }}>
                Bu hesapla çözülmüş test yok.
              </p>
            )}
          </div>

          <h2>Günlük nabız</h2>
          <div className="card">
            <table className="admin-table">
              <tbody>
                <tr>
                  <td>Durum</td>
                  <td>{PULSE_LABELS[user.pulseDetail.status]}</td>
                </tr>
                <tr>
                  <td>Eşleşme başlangıcı</td>
                  <td>{formatDateTime(user.pulseDetail.acceptedAt)}</td>
                </tr>
                {user.pulseDetail.endedAt && (
                  <tr>
                    <td>Bitiş</td>
                    <td>{formatDateTime(user.pulseDetail.endedAt)}</td>
                  </tr>
                )}
                <tr>
                  <td>Soru üretilen gün</td>
                  <td>{user.pulseDetail.checkinDays}</td>
                </tr>
                <tr>
                  <td>Bu kullanıcının cevapladığı gün</td>
                  <td>
                    {user.pulseDetail.ownAnsweredDays} (
                    {percent(user.pulseDetail.ownAnsweredDays, user.pulseDetail.checkinDays)})
                  </td>
                </tr>
                <tr>
                  <td>İki tarafın da cevapladığı gün</td>
                  <td>
                    {user.pulseDetail.bothAnsweredDays} (
                    {percent(user.pulseDetail.bothAnsweredDays, user.pulseDetail.checkinDays)})
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>Diğer kullanım</h2>
          <div className="card">
            <table className="admin-table">
              <tbody>
                <tr>
                  <td>Aktif ilişki</td>
                  <td>{user.counts.activeRelationships}</td>
                </tr>
                <tr>
                  <td>Arşivlenmiş ilişki</td>
                  <td>{user.counts.archivedRelationships}</td>
                </tr>
                <tr>
                  <td>İlişki notu</td>
                  <td>{user.counts.notes}</td>
                </tr>
                <tr>
                  <td>Tahmin</td>
                  <td>{user.counts.predictions}</td>
                </tr>
              </tbody>
            </table>
            <p className="muted small" style={{ margin: "12px 0 0" }}>
              İlişki adları, notlar ve nabız cevaplarının içeriği uygulamada yalnızca kullanıcıya gösterildiği için
              burada yer almaz.
            </p>
          </div>
        </>
      )}
    </main>
  );
}

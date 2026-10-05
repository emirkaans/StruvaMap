import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminNav } from "../../components/AdminRoute";
import { fetchAdminUsers, type AdminPulseStatus, type AdminUserRow, type AdminUsersParams } from "../../lib/api";

const PAGE_SIZE = 25;

export const PULSE_LABELS: Record<AdminPulseStatus, string> = {
  none: "Yok",
  pending: "Davet bekliyor",
  active: "Aktif",
  ended: "Bitmiş",
};

export function userDisplayName(user: Pick<AdminUserRow, "guest" | "username">): string {
  if (user.guest) return "Misafir";
  return user.username ?? "(adsız)";
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString("tr-TR") : "–";
}

/* Uygulamadaki hesaplar. Web ziyaretçilerinin hesabı yok; onlar Sonuçlar ve
   Veri silme sayfalarında oturum olarak görünür. */
export function AdminUsersPage() {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<NonNullable<AdminUsersParams["type"]>>("all");
  const [sort, setSort] = useState<NonNullable<AdminUsersParams["sort"]>>("newest");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AdminUserRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Yazarken her tuşta istek atılmasın.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setError(null);
    fetchAdminUsers({ page, pageSize: PAGE_SIZE, q: search || undefined, type, sort })
      .then((res) => {
        setRows(res.rows);
        setTotal(res.total);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Yüklenemedi."));
  }, [page, search, type, sort]);

  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="wrap admin-wrap">
      <AdminNav />
      <h1>Kullanıcılar</h1>

      <div className="admin-filters">
        <label className="admin-field">
          <span>Ara</span>
          <input
            className="admin-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Kullanıcı adı"
          />
        </label>
        <label className="admin-field">
          <span>Hesap türü</span>
          <select
            className="admin-input"
            value={type}
            onChange={(e) => {
              setType(e.target.value as typeof type);
              setPage(1);
            }}
          >
            <option value="all">Tümü</option>
            <option value="registered">Kayıtlı</option>
            <option value="guest">Misafir</option>
          </select>
        </label>
        <label className="admin-field">
          <span>Sıralama</span>
          <select
            className="admin-input"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as typeof sort);
              setPage(1);
            }}
          >
            <option value="newest">En yeni kayıt</option>
            <option value="oldest">En eski kayıt</option>
          </select>
        </label>
      </div>

      {error && <p className="admin-error">{error}</p>}

      <div className="card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Kullanıcı</th>
              <th>Tür</th>
              <th>Kayıt</th>
              <th>Son giriş</th>
              <th>Test</th>
              <th>Nabız</th>
              <th>İlişki</th>
              <th>Bildirim</th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((u) => (
              <tr key={u.id}>
                <td>
                  <Link to={`/admin/users/${u.id}`}>{userDisplayName(u)}</Link>
                </td>
                <td>{u.guest ? "Misafir" : "Kayıtlı"}</td>
                <td>{formatDate(u.createdAt)}</td>
                <td>{formatDate(u.lastSignInAt)}</td>
                <td>{u.resultCount}</td>
                <td>{PULSE_LABELS[u.pulse]}</td>
                <td>{u.relationshipCount}</td>
                <td>{u.hasPushToken ? "Açık" : "Kapalı"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows && rows.length === 0 && (
          <p className="muted small" style={{ margin: "12px 0 0" }}>
            Kayıt yok.
          </p>
        )}
        {!rows && !error && (
          <p className="muted small" style={{ margin: "12px 0 0" }}>
            Yükleniyor…
          </p>
        )}
      </div>

      <div className="admin-pagination">
        <button type="button" className="btn secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Önceki
        </button>
        <span className="small muted">
          Sayfa {page} / {lastPage} ({total} hesap)
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

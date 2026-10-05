import { useEffect, useState } from "react";
import { AdminNav } from "../../components/AdminRoute";
import { fetchAdminContactMessages, setAdminContactHandled, type AdminContactMessage, type ContactTopic } from "../../lib/api";

const PAGE_SIZE = 20;

const TOPIC_LABELS: Record<ContactTopic, string> = {
  data_request: "Veri talebi",
  feedback: "Geri bildirim",
  bug: "Hata",
  other: "Diğer",
};

type Status = "open" | "handled" | "all";

/* İletişim formundan gelen mesajlar. Yanıtlar e-postayla, panelin dışında
   verilir; burada yalnızca okunur ve "ilgilenildi" diye işaretlenir. */
export function AdminContactPage() {
  const [status, setStatus] = useState<Status>("open");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AdminContactMessage[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    setError(null);
    fetchAdminContactMessages({ page, pageSize: PAGE_SIZE, status })
      .then((res) => {
        setRows(res.rows);
        setTotal(res.total);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Yüklenemedi."));
  }, [page, status, reload]);

  async function toggle(message: AdminContactMessage) {
    try {
      await setAdminContactHandled(message.id, !message.handled_at);
      setReload((n) => n + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaydedilemedi.");
    }
  }

  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="wrap admin-wrap">
      <AdminNav />
      <h1>Mesajlar</h1>

      <div className="admin-filters">
        <label className="admin-field">
          <span>Durum</span>
          <select
            className="admin-input"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as Status);
              setPage(1);
            }}
          >
            <option value="open">Bekleyen</option>
            <option value="handled">İlgilenilen</option>
            <option value="all">Tümü</option>
          </select>
        </label>
      </div>

      {error && <p className="admin-error">{error}</p>}
      {!rows && !error && <p className="muted small">Yükleniyor…</p>}
      {rows && rows.length === 0 && <p className="muted small">Mesaj yok.</p>}

      {rows?.map((m) => (
        <div className="card admin-message" key={m.id}>
          <div className="admin-message-head">
            <span className="tag">{TOPIC_LABELS[m.topic] ?? m.topic}</span>
            <span className="muted small">
              {new Date(m.created_at).toLocaleString("tr-TR")} · {m.platform === "android" ? "Uygulama" : "Web"}
            </span>
          </div>
          <p className="admin-message-body">{m.message}</p>
          {m.reference && <p className="small muted">Bağlantı: {m.reference}</p>}
          <div className="admin-message-foot">
            {m.reply_email ? (
              <a href={`mailto:${m.reply_email}?subject=${encodeURIComponent("StruvaMap mesajın hakkında")}`}>
                {m.reply_email}
              </a>
            ) : (
              <span className="muted small">Yanıt adresi bırakılmadı</span>
            )}
            <button type="button" className="btn secondary" onClick={() => toggle(m)}>
              {m.handled_at ? "Bekleyene geri al" : "İlgilenildi"}
            </button>
          </div>
        </div>
      ))}

      <div className="admin-pagination">
        <button type="button" className="btn secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Önceki
        </button>
        <span className="small muted">
          Sayfa {page} / {lastPage} ({total} mesaj)
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

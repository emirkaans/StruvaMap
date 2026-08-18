// Auth yok — anonim oturum kimliği. Mobil uygulama gerçek auth ile gelince
// backend'deki session_id alanı user_id'ye genişletilecek (bkz. supabase/schema.sql).
const SESSION_KEY = "struva_session_id";

export function getOrCreateSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

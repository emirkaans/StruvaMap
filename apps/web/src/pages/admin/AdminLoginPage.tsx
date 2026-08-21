import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { signIn } from "../../lib/auth";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError("Giriş bilgileri hatalı.");
      return;
    }
    navigate("/admin");
  }

  return (
    <main className="wrap admin-login-wrap">
      <div className="card">
        <h1>Yönetici Girişi</h1>
        <form onSubmit={handleSubmit} className="admin-form">
          <label className="admin-field">
            <span>E-posta</span>
            <input
              type="email"
              className="admin-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label className="admin-field">
            <span>Şifre</span>
            <input
              type="password"
              className="admin-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error && <p className="admin-error">{error}</p>}
          <button type="submit" className="btn" disabled={loading}>
            {loading ? "Giriş yapılıyor…" : "Giriş yap"}
          </button>
        </form>
      </div>
    </main>
  );
}

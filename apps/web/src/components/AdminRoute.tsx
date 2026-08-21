import type { ReactNode } from "react";
import { Navigate, NavLink, useNavigate } from "react-router-dom";
import { signOut, useSession } from "../lib/auth";

export function AdminRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();

  if (loading) return null;
  if (!session) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

export function AdminNav() {
  const navigate = useNavigate();

  return (
    <nav className="admin-nav">
      <NavLink to="/admin" end>
        Özet
      </NavLink>
      <NavLink to="/admin/events">Olaylar</NavLink>
      <NavLink to="/admin/results">Sonuçlar</NavLink>
      <NavLink to="/admin/comparisons">Kıyaslamalar</NavLink>
      <button
        type="button"
        className="admin-nav-logout"
        onClick={() => signOut().then(() => navigate("/admin/login"))}
      >
        Çıkış
      </button>
    </nav>
  );
}

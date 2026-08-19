import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

// Anasayfa dışında hero yok, o yüzden ücretsiz dene CTA'sı sadece anasayfada
// gösteriliyor — diğer sayfalarda logo tek başına yeterli, sayfa zaten bir
// testin/sonucun içinde.
export function Header({ cta, className }: { cta?: ReactNode; className?: string }) {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const navClass = [isHome ? "landing-nav" : "page-nav", className].filter(Boolean).join(" ");

  return (
    <nav className={navClass}>
      <Link to="/" className="logo-lg">
        Struva<span>Map</span>
      </Link>
      {isHome && cta}
    </nav>
  );
}

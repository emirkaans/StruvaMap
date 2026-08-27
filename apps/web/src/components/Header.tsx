import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

function LogoMark() {
  return (
    <svg className="logo-mark" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="logoMarkLeaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="var(--accent)" />
        </linearGradient>
        <filter id="logoMarkGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>
      <g fill="url(#logoMarkLeaf)">
        <ellipse cx="51.7" cy="28.5" rx="5" ry="2.2" transform="rotate(80 51.7 28.5)" />
        <ellipse cx="48.4" cy="43.5" rx="5" ry="2.2" transform="rotate(125 48.4 43.5)" />
        <ellipse cx="35.5" cy="51.7" rx="5" ry="2.2" transform="rotate(170 35.5 51.7)" />
        <ellipse cx="20.5" cy="48.4" rx="5" ry="2.2" transform="rotate(215 20.5 48.4)" />
        <ellipse cx="12.3" cy="35.5" rx="5" ry="2.2" transform="rotate(260 12.3 35.5)" />
        <ellipse cx="15.6" cy="20.5" rx="5" ry="2.2" transform="rotate(305 15.6 20.5)" />
        <ellipse cx="25.2" cy="13.2" rx="5" ry="2.2" transform="rotate(340 25.2 13.2)" />
      </g>
      <circle cx="48.4" cy="20.5" r="4" fill="#ffffff" filter="url(#logoMarkGlow)" />
      <circle cx="48.4" cy="20.5" r="2" fill="var(--accent)" />
    </svg>
  );
}

export function Header({ cta, className }: { cta?: ReactNode; className?: string }) {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const navClass = [isHome ? "landing-nav" : "page-nav", className].filter(Boolean).join(" ");

  return (
    <nav className={navClass}>
      <Link to="/" className="logo-lg">
        <LogoMark />
        Struva<span>Map</span>
      </Link>
      {isHome && cta}
    </nav>
  );
}

import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import logoMark from "../assets/struvamap-3d-logo.svg";

export function Header({ cta, className }: { cta?: ReactNode; className?: string }) {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const navClass = [isHome ? "landing-nav" : "page-nav", className].filter(Boolean).join(" ");

  return (
    <nav className={navClass}>
      <Link to="/" className="logo-lg">
        <img className="logo-mark" src={logoMark} alt="" aria-hidden="true" />
        Struva<span>Map</span>
      </Link>
      {isHome && cta}
    </nav>
  );
}

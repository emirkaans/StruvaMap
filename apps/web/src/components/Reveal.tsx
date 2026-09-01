import type { HTMLAttributes, ReactNode } from "react";
import { useRevealed } from "../lib/useRevealed";

interface RevealProps extends HTMLAttributes<HTMLDivElement> {
  group?: boolean;
  children: ReactNode;
}

export function Reveal({ group = false, className = "", children, ...rest }: RevealProps) {
  const [ref, visible] = useRevealed<HTMLDivElement>(0.12);

  const cls = [group ? "reveal-group" : "reveal", visible && "is-visible", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={ref} className={cls} {...rest}>
      {children}
    </div>
  );
}

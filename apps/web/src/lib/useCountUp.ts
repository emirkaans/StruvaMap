import { useEffect, useState } from "react";

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/* Mount olur olmaz 0'dan hedef değere sayar — RSI hero numarası her zaman
   ilk ekranda olduğundan scroll'a bağlı tetikleme gerekmez; bu da yazdırma
   anında "sayaç henüz başlamadı" riskini ortadan kaldırır. delayMs, birden
   fazla sayacın (ör. kıyaslamada iki taraf + fark) art arda saymasını sağlar. */
export function useCountUp(target: number, durationMs = 900, delayMs = 0): number {
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(target);
      return;
    }

    setDisplay(0);
    let raf: number;
    let timeout: ReturnType<typeof setTimeout>;
    const tick = (start: number) => (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setDisplay(Math.round(target * easeOutCubic(t)));
      if (t < 1) raf = requestAnimationFrame(tick(start));
    };
    timeout = setTimeout(() => {
      raf = requestAnimationFrame((now) => tick(now)(now));
    }, delayMs);
    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [target, durationMs, delayMs]);

  return display;
}

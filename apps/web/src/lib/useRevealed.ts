import { useEffect, useRef, useState, type RefObject } from "react";

/* Reveal bileşeniyle aynı görünüme-girince-tetikle mantığı; Donut/Bar gibi
   veri görselleri de scroll'a girince dolum animasyonunu başlatabilsin diye
   paylaşılan hook. */
export function useRevealed<T extends Element>(threshold = 0.12): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, visible];
}

import { useEffect } from "react";

const BRAND = "StruvaMap";
const DEFAULT_TITLE = `${BRAND} · İlişkilerin görünmeyen yapısını haritalayın`;

/* Sekme başlığı ve paylaşılan linklerin yedek başlığı sayfaya özel olsun.
   title boşsa (henüz yüklenmediyse ya da anasayfadaysa) marka başlığı. */
export function useDocumentTitle(title?: string | null) {
  useEffect(() => {
    document.title = title ? `${title} · ${BRAND}` : DEFAULT_TITLE;
  }, [title]);
}

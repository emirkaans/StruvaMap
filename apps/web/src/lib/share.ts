export type ShareOutcome = "shared" | "copied" | "cancelled";

/* Telefonda paylaşım menüsü (WhatsApp, Instagram vb.), masaüstünde panoya
   kopyalama. Masaüstü tarayıcıların da navigator.share'i olabiliyor ama
   orada işletim sisteminin paylaşım penceresi açılıyor; kopyalamak daha
   beklenen davranış, bu yüzden yalnızca dokunmatik cihazda kullanılır. */
export async function shareOrCopy(data: { title: string; text?: string; url: string }): Promise<ShareOutcome> {
  const touch = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
  if (touch && typeof navigator.share === "function") {
    try {
      await navigator.share(data);
      return "shared";
    } catch (e) {
      // Kullanıcı menüyü kapattı: kopyalamaya düşme, sessizce bitir.
      if (e instanceof DOMException && e.name === "AbortError") return "cancelled";
    }
  }
  await navigator.clipboard.writeText(data.url);
  return "copied";
}

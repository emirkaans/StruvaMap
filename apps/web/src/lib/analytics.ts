import { API_URL } from "./api";
import { getOrCreateSessionId } from "./session";

/* Kendi API'mize yazılan olay kaydı. Üçüncü taraf yok, çerez yok, IP ya da
   kimlik bilgisi gönderilmiyor — footer'daki gizlilik vaadiyle uyumlu.
   Amaç: huninin nerede koptuğunu görmek (kaç kişi başlıyor, kaçıncı soruda
   bırakıyor, davet bağlantısı kullanılıyor mu). */

export type EventName =
  | "landing_view"
  | "test_start"
  | "test_progress"
  | "test_complete"
  | "result_view"
  | "comparison_view"
  | "invite_copied"
  | "link_copied"
  | "share_image_download"
  | "print_pdf"
  | "playstore_click";

interface TrackOptions {
  testId?: string;
  props?: Record<string, string | number | boolean>;
}

export function track(name: EventName, options: TrackOptions = {}): void {
  try {
    const payload = JSON.stringify({
      name,
      sessionId: getOrCreateSessionId(),
      testId: options.testId,
      props: options.props,
    });
    const url = `${API_URL}/events`;

    // keepalive: sayfa kapanırken bile istek tamamlanır. sendBeacon burada
    // kullanılmıyor — JSON gövde CORS ön kontrolü gerektiriyor ve beacon
    // isteği cross-origin'de sessizce düşüyor.
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Ölçüm kaydı başarısız olursa kullanıcı akışı etkilenmemeli.
    });
  } catch {
    // Ölçüm hiçbir koşulda uygulamayı bozmamalı.
  }
}

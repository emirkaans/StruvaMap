/* Sentry yalnızca VITE_SENTRY_DSN tanımlıysa devreye girer. Dinamik import
   sayesinde DSN yoksa SDK ana bundle'a hiç girmez, ayrı bir chunk olarak
   yalnızca gerektiğinde indirilir. */

type SentryModule = typeof import("@sentry/react");

let sentry: SentryModule | null = null;

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

export async function initMonitoring(): Promise<void> {
  if (!DSN) return;
  try {
    const Sentry = await import("@sentry/react");
    Sentry.init({
      dsn: DSN,
      environment: import.meta.env.MODE,
      // Oturum kaydı/replay yok: footer'daki "kimlik bilgisi toplanmaz"
      // vaadiyle tutarlı kalsın diye yalnızca hata raporu gönderiyoruz.
      tracesSampleRate: 0,
      sendDefaultPii: false,
    });
    sentry = Sentry;
  } catch {
    // İzleme kurulamadıysa uygulama normal çalışmaya devam etmeli.
  }
}

export function captureError(error: unknown, context?: Record<string, unknown>): void {
  if (sentry) {
    sentry.captureException(error, context ? { extra: context } : undefined);
    return;
  }
  console.error("[struva]", error, context ?? "");
}

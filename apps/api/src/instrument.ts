/* Sentry, diğer modüller yüklenmeden önce başlatılmalı — bu yüzden main.ts'in
   ilk satırında import ediliyor. SENTRY_DSN tanımlı değilse hiçbir şey
   yapmaz; uygulama izleme olmadan normal çalışır. */
import * as Sentry from '@sentry/nestjs';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    // Kullanıcı verisi (IP, gövde içeriği) gönderilmesin.
    sendDefaultPii: false,
    tracesSampleRate: 0,
  });
}

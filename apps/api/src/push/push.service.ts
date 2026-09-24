import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

export type PulsePushKind = 'morning' | 'partner_answered' | 'weekly_summary';

// SENTRY_DSN'deki gibi: kimlik bilgisi tanımlı değilse sessizce devre dışı
// kalır, göndermeyi deneyen çağıran taraf hata almaz — sadece push gitmez.
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly app: App | null;

  constructor(config: ConfigService) {
    const encoded = config.get<string>('FIREBASE_SERVICE_ACCOUNT_BASE64');
    if (!encoded) {
      this.logger.warn('FIREBASE_SERVICE_ACCOUNT_BASE64 tanımlı değil, push bildirimleri devre dışı.');
      this.app = null;
      return;
    }
    const serviceAccount = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
    this.app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(serviceAccount) });
  }

  async sendComparisonReady(fcmToken: string, comparisonId: string): Promise<void> {
    if (!this.app) return;
    try {
      // notification bloğu yerine bilinçli olarak data-only: istemci
      // (FcmService) bildirimi her zaman kendi inşa etsin istiyoruz — hem
      // ön planda hem arka planda tutarlı davranış için (bkz. Android
      // FcmService.onMessageReceived).
      await getMessaging(this.app).send({
        token: fcmToken,
        data: {
          title: 'Kıyaslama hazır',
          body: 'Davet ettiğin kişi testi tamamladı — sonuçlarınız hazır.',
          comparisonId,
        },
      });
    } catch (error) {
      // Push başarısız olsa da kıyaslama zaten oluştu — kullanıcı uygulamayı
      // açtığında yoklama (polling) ile de bulacak, bu yüzden burada fırlatmıyoruz.
      this.logger.warn(`Push gönderilemedi: ${(error as Error).message}`);
    }
  }

  async sendPulseReady(
    fcmToken: string,
    pairId: string,
    kind: PulsePushKind,
    title: string,
    body: string,
    // checkinId: istemci bildirimde 1-5 hızlı cevap düğmelerini yalnızca bu
    // alan varsa gösterir (bkz. Android FcmService) — cevaplanmamış bir güne
    // ait push'larda gönderilmeli.
    extra: { checkinId?: string } = {},
  ): Promise<void> {
    if (!this.app) return;
    try {
      const data: Record<string, string> = { title, body, pairId, kind };
      if (extra.checkinId) data.checkinId = extra.checkinId;
      await getMessaging(this.app).send({ token: fcmToken, data });
    } catch (error) {
      // Cron her pair'i tek tek işliyor (bkz. pulse-cron.service.ts) — bir
      // token'ın push'u başarısız olması diğer pair'leri etkilemesin diye
      // burada da fırlatmıyoruz, yalnızca logluyoruz.
      this.logger.warn(`Nabız push'u gönderilemedi: ${(error as Error).message}`);
    }
  }
}

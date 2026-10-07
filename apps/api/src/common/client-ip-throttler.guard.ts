import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';

// İstek sınırını kişi başına uygulamak için gerçek istemci IP'si gerekiyor.
// API Render'da çalışıyor ve Render her isteği önündeki Cloudflare katmanından
// geçiriyor; uygulamaya gelen bağlantının IP'si proxy'ye ait olduğu için
// varsayılan izleyici herkesi tek kişi sayıp sınırı ortak tüketiyordu.
// CF-Connecting-IP'yi Cloudflare kendisi yazar, istemcinin gönderdiği değeri
// ezer. Başlık yoksa (yerelde) main.ts'teki trust proxy ayarıyla hesaplanan
// req.ip kullanılır.
@Injectable()
export class ClientIpThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Request): Promise<string> {
    const cfIp = req.headers['cf-connecting-ip'];
    if (typeof cfIp === 'string' && cfIp.length > 0)
      return Promise.resolve(cfIp);
    return Promise.resolve(req.ip ?? 'unknown');
  }
}

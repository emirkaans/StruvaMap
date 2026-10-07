import './instrument';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Render'ın proxy'si arkasındayız: req.ip, X-Forwarded-For'daki son
  // proxy'nin eklediği adresten okunsun (bkz. common/client-ip-throttler.guard.ts).
  app.set('trust proxy', 1);
  // WEB_ORIGIN virgülle ayrılmış birden fazla origin taşıyabilir (ör. kök +
  // www domain) — domain geçişleri sırasında eski ve yeni adres bir arada
  // desteklenebilsin diye.
  const webOrigins = (process.env.WEB_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim());
  app.enableCors({ origin: webOrigins });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { SupabaseModule } from './supabase/supabase.module';
import { TestsModule } from './tests/tests.module';
import { ResultsModule } from './results/results.module';
import { ComparisonsModule } from './comparisons/comparisons.module';
import { EventsModule } from './events/events.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    // Varsayılan: dakikada 30 istek / IP. Anonim, kimliksiz endpoint'ler
    // (results, comparisons, events) için tek savunma katmanı bu.
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }]),
    SupabaseModule,
    TestsModule,
    ResultsModule,
    ComparisonsModule,
    EventsModule,
    AdminModule,
  ],
  providers: [
    // SENTRY_DSN yoksa Sentry.init hiç çalışmadığı için bu filtre de sessiz kalır;
    // yakaladığı hatayı her koşulda normal Nest yanıtına çevirmeye devam eder.
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}

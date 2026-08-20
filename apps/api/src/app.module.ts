import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { SupabaseModule } from './supabase/supabase.module';
import { TestsModule } from './tests/tests.module';
import { ResultsModule } from './results/results.module';
import { ComparisonsModule } from './comparisons/comparisons.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    TestsModule,
    ResultsModule,
    ComparisonsModule,
    EventsModule,
  ],
  // SENTRY_DSN yoksa Sentry.init hiç çalışmadığı için bu filtre de sessiz kalır;
  // yakaladığı hatayı her koşulda normal Nest yanıtına çevirmeye devam eder.
  providers: [{ provide: APP_FILTER, useClass: SentryGlobalFilter }],
})
export class AppModule {}

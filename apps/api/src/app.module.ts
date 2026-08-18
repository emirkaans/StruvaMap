import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { TestsModule } from './tests/tests.module';
import { ResultsModule } from './results/results.module';
import { ComparisonsModule } from './comparisons/comparisons.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    TestsModule,
    ResultsModule,
    ComparisonsModule,
  ],
})
export class AppModule {}

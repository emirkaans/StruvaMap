import { Global, Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

// Global: her modül tek bir Supabase client instance'ını paylaşır.
@Global()
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}

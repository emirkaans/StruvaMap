import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { TrackEventDto } from './track-event.dto';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(private readonly supabase: SupabaseService) {}

  /* Ölçüm kaydı asla kullanıcı akışını bozmamalı: yazma başarısız olursa
     hata fırlatmak yerine logluyoruz. */
  async track(dto: TrackEventDto): Promise<void> {
    const { error } = await this.supabase.client.from('events').insert({
      name: dto.name,
      session_id: dto.sessionId,
      test_id: dto.testId ?? null,
      props: dto.props ?? null,
    });

    if (error) {
      this.logger.warn(`Olay kaydedilemedi (${dto.name}): ${error.message}`);
    }
  }
}

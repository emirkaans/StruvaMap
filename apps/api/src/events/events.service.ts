import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { EVENT_NAMES, TrackEventDto } from './track-event.dto';

export interface EventCount {
  name: string;
  count: number;
}

export interface EventDailyCount {
  date: string;
  count: number;
}

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

  private async countOne(name: string, from?: string, to?: string): Promise<number> {
    let query = this.supabase.client
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('name', name);

    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);

    const { count, error } = await query;
    if (error) throw new InternalServerErrorException(error.message);
    return count ?? 0;
  }

  /* Bilinen olay adlarının tümü için sayaç. N ayrı count sorgusu — olay
     hacmi düşükken Postgres tarafında group-by/RPC yazmaya gerek yok. */
  async countByName(from?: string, to?: string): Promise<EventCount[]> {
    const counts = await Promise.all(EVENT_NAMES.map((name) => this.countOne(name, from, to)));
    return EVENT_NAMES.map((name, i) => ({ name, count: counts[i] }));
  }

  /* Sabit sıralı huni: her adımın kaç kez tetiklendiği, giriş sırası korunarak. */
  async funnel(names: readonly string[], from?: string, to?: string): Promise<EventCount[]> {
    const counts = await Promise.all(names.map((name) => this.countOne(name, from, to)));
    return names.map((name, i) => ({ name, count: counts[i] }));
  }

  async dailyTrend(name: string, from?: string, to?: string): Promise<EventDailyCount[]> {
    let query = this.supabase.client.from('events').select('created_at').eq('name', name);
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);

    const { data, error } = await query;
    if (error) throw new InternalServerErrorException(error.message);

    const buckets = new Map<string, number>();
    for (const row of data ?? []) {
      const date = (row.created_at as string).slice(0, 10);
      buckets.set(date, (buckets.get(date) ?? 0) + 1);
    }

    return [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }
}

import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { bucketByDay, DailyCount } from '../common/bucket-by-day';
import { fetchAll } from '../common/fetch-all';
import { EVENT_NAMES, Platform, TrackEventDto } from './track-event.dto';

export interface EventCount {
  name: string;
  count: number;
}

// Huni adımı: olay sayısının yanında kaç farklı oturumun o adıma geldiği.
// Oranlar oturum sayısıyla hesaplanır; aynı kişi bir sayfayı beş kez açınca
// beş kez sayılmasın diye.
export interface FunnelStep extends EventCount {
  sessions: number;
}

export type EventDailyCount = DailyCount;

export interface EventFilter {
  name?: string;
  from?: string;
  to?: string;
  platform?: Platform;
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(private readonly supabase: SupabaseService) {}

  /* Ölçüm kaydı asla kullanıcı akışını bozmamalı: yazma başarısız olursa
     hata fırlatmak yerine logluyoruz. */
  async track(dto: TrackEventDto, platform: Platform): Promise<void> {
    const { error } = await this.supabase.client.from('events').insert({
      name: dto.name,
      session_id: dto.sessionId,
      test_id: dto.testId ?? null,
      props: { ...(dto.props ?? {}), platform },
    });

    if (error) {
      this.logger.warn(`Olay kaydedilemedi (${dto.name}): ${error.message}`);
    }
  }

  private async countOne(filter: EventFilter): Promise<number> {
    let query = this.supabase.client
      .from('events')
      .select('*', { count: 'exact', head: true });
    if (filter.name) query = query.eq('name', filter.name);
    if (filter.platform) query = query.eq('props->>platform', filter.platform);
    if (filter.from) query = query.gte('created_at', filter.from);
    if (filter.to) query = query.lte('created_at', filter.to);

    const { count, error } = await query;
    if (error) throw new InternalServerErrorException(error.message);
    return count ?? 0;
  }

  /* Filtreye uyan olayların oturum kimlikleri ve zamanları, sayfa sayfa. */
  private async fetchRows(
    filter: EventFilter,
  ): Promise<{ session_id: string; created_at: string }[]> {
    return fetchAll((from, to) => {
      let query = this.supabase.client
        .from('events')
        .select('session_id, created_at');
      if (filter.name) query = query.eq('name', filter.name);
      if (filter.platform)
        query = query.eq('props->>platform', filter.platform);
      if (filter.from) query = query.gte('created_at', filter.from);
      if (filter.to) query = query.lte('created_at', filter.to);
      return query.order('id').range(from, to);
    });
  }

  /* Bilinen olay adlarının tümü için sayaç. N ayrı count sorgusu — olay
     hacmi düşükken Postgres tarafında group-by/RPC yazmaya gerek yok. */
  async countByName(
    filter: Omit<EventFilter, 'name'> = {},
  ): Promise<EventCount[]> {
    const counts = await Promise.all(
      EVENT_NAMES.map((name) => this.countOne({ ...filter, name })),
    );
    return EVENT_NAMES.map((name, i) => ({ name, count: counts[i] }));
  }

  /* Sabit sıralı huni, giriş sırası korunarak. */
  async funnel(
    names: readonly string[],
    filter: Omit<EventFilter, 'name'> = {},
  ): Promise<FunnelStep[]> {
    return Promise.all(
      names.map(async (name) => {
        const rows = await this.fetchRows({ ...filter, name });
        return {
          name,
          count: rows.length,
          sessions: new Set(rows.map((r) => r.session_id)).size,
        };
      }),
    );
  }

  /* Aralıkta en az bir olay üreten farklı oturum sayısı (aktif kullanıcı yaklaşığı). */
  async distinctSessions(filter: EventFilter): Promise<number> {
    const rows = await this.fetchRows(filter);
    return new Set(rows.map((r) => r.session_id)).size;
  }

  async dailyTrend(filter: EventFilter): Promise<EventDailyCount[]> {
    return bucketByDay(await this.fetchRows(filter));
  }

  /* Belirli bir olayın props alanındaki bir anahtara göre dağılımı
     (ör. pulse_answer için props.source). */
  async countByProp(
    name: string,
    prop: string,
    filter: Omit<EventFilter, 'name'> = {},
  ): Promise<Record<string, number>> {
    const rows = await fetchAll((from, to) => {
      let query = this.supabase.client
        .from('events')
        .select('props')
        .eq('name', name);
      if (filter.platform)
        query = query.eq('props->>platform', filter.platform);
      if (filter.from) query = query.gte('created_at', filter.from);
      if (filter.to) query = query.lte('created_at', filter.to);
      return query.order('id').range(from, to);
    });
    const counts: Record<string, number> = {};
    for (const row of rows as { props: Record<string, unknown> | null }[]) {
      const raw = row.props?.[prop];
      const key = typeof raw === 'string' ? raw : 'belirtilmemiş';
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }
}

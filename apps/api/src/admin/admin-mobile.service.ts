import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { EventsService } from '../events/events.service';
import { fetchAll } from '../common/fetch-all';
import { daysAgoDateString } from '../pulse/pulse-date.util';

export interface AdminMobileSummary {
  users: {
    total: number;
    guests: number;
    registered: number;
    newInRange: number;
    newGuestsInRange: number;
  };
  // Android'den olay gönderen farklı oturumlar; olaylara platform bilgisi
  // eklenmeden önceki dönem sayılmaz.
  activeSessions: { last7Days: number; last30Days: number };
  pulse: {
    activePairs: number;
    pendingPairs: number;
    endedPairs: number;
    endedInRange: number;
    checkinDays: number;
    anyAnsweredDays: number;
    bothAnsweredDays: number;
    answerSources: Record<string, number>;
  };
  push: {
    usersWithToken: number;
    // Son 7 gün, en yeni önce: o gün sabah bildirimi giden eşleşme ve akşam
    // hatırlatması giden kişi sayısı (pulse_checkins üzerindeki damgalardan).
    days: { date: string; morningPairs: number; eveningPeople: number }[];
  };
}

interface CheckinStats {
  checkin_date: string;
  answer_a: number | null;
  answer_b: number | null;
  morning_push_sent_at: string | null;
  evening_notified_a_at: string | null;
  evening_notified_b_at: string | null;
}

const PUSH_DAYS = 7;

@Injectable()
export class AdminMobileService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly events: EventsService,
  ) {}

  async summary(from?: string, to?: string): Promise<AdminMobileSummary> {
    const [
      users,
      last7Days,
      last30Days,
      pairs,
      endedInRange,
      checkins,
      answerSources,
      usersWithToken,
      pushRows,
    ] = await Promise.all([
      this.userCounts(from, to),
      this.events.distinctSessions({
        platform: 'android',
        from: this.daysAgoIso(7),
      }),
      this.events.distinctSessions({
        platform: 'android',
        from: this.daysAgoIso(30),
      }),
      this.pairCounts(),
      this.endedPairsInRange(from, to),
      this.checkins(from?.slice(0, 10), to?.slice(0, 10)),
      this.events.countByProp('pulse_answer', 'source', { from, to }),
      this.headCount(this.countQuery('user_push_tokens')),
      this.checkins(daysAgoDateString(PUSH_DAYS - 1)),
    ]);

    return {
      users,
      activeSessions: { last7Days, last30Days },
      pulse: {
        ...pairs,
        endedInRange,
        checkinDays: checkins.length,
        anyAnsweredDays: checkins.filter(
          (c) => c.answer_a != null || c.answer_b != null,
        ).length,
        bothAnsweredDays: checkins.filter(
          (c) => c.answer_a != null && c.answer_b != null,
        ).length,
        answerSources,
      },
      push: { usersWithToken, days: this.pushDays(pushRows) },
    };
  }

  // Supabase Auth kullanıcıları (anonim misafirler dahil); admin API sayfalı.
  private async userCounts(
    from?: string,
    to?: string,
  ): Promise<AdminMobileSummary['users']> {
    const perPage = 1000;
    let total = 0;
    let guests = 0;
    let newInRange = 0;
    let newGuestsInRange = 0;
    for (let page = 1; ; page++) {
      const { data, error } = await this.supabase.client.auth.admin.listUsers({
        page,
        perPage,
      });
      if (error) throw new InternalServerErrorException(error.message);
      for (const user of data.users) {
        total++;
        const guest = user.is_anonymous === true;
        if (guest) guests++;
        const inRange =
          (!from || user.created_at >= from) && (!to || user.created_at <= to);
        if (inRange) {
          newInRange++;
          if (guest) newGuestsInRange++;
        }
      }
      if (data.users.length < perPage) break;
    }
    return {
      total,
      guests,
      registered: total - guests,
      newInRange,
      newGuestsInRange,
    };
  }

  private async pairCounts(): Promise<{
    activePairs: number;
    pendingPairs: number;
    endedPairs: number;
  }> {
    const [activePairs, pendingPairs, endedPairs] = await Promise.all(
      ['active', 'pending', 'ended'].map((status) =>
        this.headCount(this.countQuery('pulse_pairs').eq('status', status)),
      ),
    );
    return { activePairs, pendingPairs, endedPairs };
  }

  private endedPairsInRange(from?: string, to?: string): Promise<number> {
    let query = this.countQuery('pulse_pairs').eq('status', 'ended');
    if (from) query = query.gte('ended_at', from);
    if (to) query = query.lte('ended_at', to);
    return this.headCount(query);
  }

  private checkins(
    fromDate?: string,
    toDate?: string,
  ): Promise<CheckinStats[]> {
    return fetchAll((start, end) => {
      let query = this.supabase.client
        .from('pulse_checkins')
        .select(
          'checkin_date, answer_a, answer_b, morning_push_sent_at, evening_notified_a_at, evening_notified_b_at',
        );
      if (fromDate) query = query.gte('checkin_date', fromDate);
      if (toDate) query = query.lte('checkin_date', toDate);
      return query.order('id').range(start, end);
    });
  }

  private pushDays(rows: CheckinStats[]): AdminMobileSummary['push']['days'] {
    return Array.from({ length: PUSH_DAYS }, (_, i) => {
      const date = daysAgoDateString(i);
      const day = rows.filter((r) => r.checkin_date === date);
      return {
        date,
        morningPairs: day.filter((r) => r.morning_push_sent_at).length,
        eveningPeople: day.reduce(
          (sum, r) =>
            sum +
            (r.evening_notified_a_at ? 1 : 0) +
            (r.evening_notified_b_at ? 1 : 0),
          0,
        ),
      };
    });
  }

  private countQuery(table: string) {
    return this.supabase.client
      .from(table)
      .select('*', { count: 'exact', head: true });
  }

  private async headCount(
    query: PromiseLike<{
      count: number | null;
      error: { message: string } | null;
    }>,
  ): Promise<number> {
    const { count, error } = await query;
    if (error) throw new InternalServerErrorException(error.message);
    return count ?? 0;
  }

  private daysAgoIso(days: number): string {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  }
}

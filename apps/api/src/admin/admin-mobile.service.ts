import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { evaluatePrediction } from '@struva/shared';
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
  // Mobil özelliklerin kullanımı. "InRange" alanları tarih aralığına,
  // diğerleri tüm zamana göre.
  features: {
    relationships: {
      total: number;
      archived: number;
      users: number;
      linkedResults: number;
    };
    // evaluated: karşı taraf testi bitirip kıyaslama oluşmuş tahminler;
    // averageAccuracy bunların ortalama isabeti (0-100), yoksa null.
    predictions: {
      total: number;
      evaluated: number;
      averageAccuracy: number | null;
    };
    claims: { createdInRange: number; redeemedInRange: number };
  };
}

interface ScoreDimensions {
  id: string;
  score: { dimensions: Record<string, number> };
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
      features,
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
      this.features(from, to),
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
      features,
    };
  }

  private async features(
    from?: string,
    to?: string,
  ): Promise<AdminMobileSummary['features']> {
    const inRange = <
      T extends {
        gte: (c: string, v: string) => T;
        lte: (c: string, v: string) => T;
      },
    >(
      query: T,
      column: string,
    ): T => {
      let q = query;
      if (from) q = q.gte(column, from);
      if (to) q = q.lte(column, to);
      return q;
    };

    const [
      relationships,
      linkedResults,
      predictions,
      claimsCreated,
      claimsRedeemed,
    ] = await Promise.all([
      fetchAll<{ user_id: string; archived_at: string | null }>((start, end) =>
        this.supabase.client
          .from('relationships')
          .select('user_id, archived_at')
          .order('id')
          .range(start, end),
      ),
      this.headCount(
        this.countQuery('results').not('relationship_id', 'is', null),
      ),
      this.predictionStats(),
      this.headCount(inRange(this.countQuery('claim_tokens'), 'created_at')),
      this.headCount(inRange(this.countQuery('claim_tokens'), 'claimed_at')),
    ]);

    return {
      relationships: {
        total: relationships.length,
        archived: relationships.filter((r) => r.archived_at).length,
        users: new Set(relationships.map((r) => r.user_id)).size,
        linkedResults,
      },
      predictions,
      claims: {
        createdInRange: claimsCreated,
        redeemedInRange: claimsRedeemed,
      },
    };
  }

  // Kıyaslama ekranındaki hesabın aynısı (ComparisonsService): tahmin, tahmin
  // edenin kendi skoru ve karşı tarafın gerçek skoruyla değerlendirilir.
  private async predictionStats(): Promise<
    AdminMobileSummary['features']['predictions']
  > {
    const predictions = await fetchAll<{
      result_id: string;
      dimensions: Record<string, number>;
    }>((start, end) =>
      this.supabase.client
        .from('predictions')
        .select('result_id, dimensions')
        .order('result_id')
        .range(start, end),
    );
    if (predictions.length === 0) {
      return { total: 0, evaluated: 0, averageAccuracy: null };
    }

    const ids = predictions.map((p) => p.result_id);
    const comparisons = await fetchAll<{
      result_id_a: string;
      result_id_b: string;
    }>((start, end) =>
      this.supabase.client
        .from('comparisons')
        .select('result_id_a, result_id_b')
        .or(
          `result_id_a.in.(${ids.join(',')}),result_id_b.in.(${ids.join(',')})`,
        )
        .order('id')
        .range(start, end),
    );
    const partnerOf = new Map<string, string>();
    for (const c of comparisons) {
      partnerOf.set(c.result_id_a, c.result_id_b);
      partnerOf.set(c.result_id_b, c.result_id_a);
    }

    const scoreIds = [
      ...new Set(comparisons.flatMap((c) => [c.result_id_a, c.result_id_b])),
    ];
    const scores = new Map<string, Record<string, number>>();
    if (scoreIds.length > 0) {
      const rows = await fetchAll<ScoreDimensions>((start, end) =>
        this.supabase.client
          .from('results')
          .select('id, score')
          .in('id', scoreIds)
          .order('id')
          .range(start, end),
      );
      for (const row of rows) scores.set(row.id, row.score.dimensions);
    }

    const accuracies = predictions.flatMap((p) => {
      const partner = partnerOf.get(p.result_id);
      const own = scores.get(p.result_id);
      const actual = partner ? scores.get(partner) : undefined;
      if (!own || !actual) return [];
      const summary = evaluatePrediction(own, p.dimensions, actual);
      return summary ? [summary.accuracy] : [];
    });

    return {
      total: predictions.length,
      evaluated: accuracies.length,
      averageAccuracy: accuracies.length
        ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length)
        : null,
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

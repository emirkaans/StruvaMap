import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { fetchAll } from '../common/fetch-all';

/* Kişisel veri silme talepleri (gizlilik sayfası: "sonuç ya da davet
   bağlantısıyla bize ulaş"). Bağlantıdaki kimlikten oturum bulunur; silme
   oturum bazında yapılır, çünkü aynı cihazın tüm sonuçları ve olayları aynı
   session_id'yi taşır. */

export interface SessionResult {
  id: string;
  testId: string;
  createdAt: string;
  // Mobil hesaba bağlı mı (web sonuçlarında hep false).
  linkedToAccount: boolean;
}

export interface SessionData {
  sessionId: string;
  results: SessionResult[];
  comparisonCount: number;
  eventCount: number;
}

export interface DataLookup {
  matchedAs: 'result' | 'comparison';
  sessions: SessionData[];
}

export interface DeletionReport {
  comparisons: number;
  results: number;
  events: number;
}

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

// Bağlantının tamamı ya da yalnızca kimlik yapıştırılabilir; ilk UUID alınır.
export function extractId(input: string): string | null {
  return input.match(UUID)?.[0].toLowerCase() ?? null;
}

interface ResultRow {
  id: string;
  test_id: string;
  session_id: string;
  user_id: string | null;
  created_at: string;
}

@Injectable()
export class AdminDataService {
  constructor(private readonly supabase: SupabaseService) {}

  async lookup(input: string): Promise<DataLookup> {
    const id = extractId(input);
    if (!id)
      throw new BadRequestException(
        'Bağlantıda geçerli bir kimlik bulunamadı.',
      );

    const result = await this.resultById(id);
    if (result) {
      return {
        matchedAs: 'result',
        sessions: [await this.sessionData(result.session_id)],
      };
    }

    const { data: comparison, error } = await this.supabase.client
      .from('comparisons')
      .select('result_id_a, result_id_b')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    if (!comparison)
      throw new NotFoundException(
        'Bu kimlikle sonuç ya da kıyaslama bulunamadı.',
      );

    const pair: { result_id_a: string; result_id_b: string } = comparison;
    const results = await Promise.all([
      this.resultById(pair.result_id_a),
      this.resultById(pair.result_id_b),
    ]);
    const sessionIds = [
      ...new Set(results.flatMap((r) => (r ? [r.session_id] : []))),
    ];
    return {
      matchedAs: 'comparison',
      sessions: await Promise.all(sessionIds.map((s) => this.sessionData(s))),
    };
  }

  // Sıra önemli: comparisons sonuçlara "on delete cascade" olmadan bağlı,
  // önce onlar silinmezse sonuç silinemez. Tahmin, bildirim kaydı ve claim
  // token'ları sonuçla birlikte cascade ile gider.
  async deleteSession(sessionId: string): Promise<DeletionReport> {
    const resultIds = (await this.sessionResults(sessionId)).map((r) => r.id);
    if (resultIds.length === 0 && (await this.eventCount(sessionId)) === 0) {
      throw new NotFoundException('Bu oturuma ait veri bulunamadı.');
    }

    let comparisons = 0;
    let results = 0;
    if (resultIds.length > 0) {
      const list = resultIds.join(',');
      const { data: deletedComparisons, error: comparisonError } =
        await this.supabase.client
          .from('comparisons')
          .delete()
          .or(`result_id_a.in.(${list}),result_id_b.in.(${list})`)
          .select('id');
      if (comparisonError)
        throw new InternalServerErrorException(comparisonError.message);
      comparisons = deletedComparisons?.length ?? 0;

      const { data: deletedResults, error: resultError } =
        await this.supabase.client
          .from('results')
          .delete()
          .eq('session_id', sessionId)
          .select('id');
      if (resultError)
        throw new InternalServerErrorException(resultError.message);
      results = deletedResults?.length ?? 0;
    }

    const { count: events, error: eventError } = await this.supabase.client
      .from('events')
      .delete({ count: 'exact' })
      .eq('session_id', sessionId);
    if (eventError) throw new InternalServerErrorException(eventError.message);

    return { comparisons, results, events: events ?? 0 };
  }

  private async resultById(id: string): Promise<ResultRow | null> {
    const { data, error } = await this.supabase.client
      .from('results')
      .select('id, test_id, session_id, user_id, created_at')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  private sessionResults(sessionId: string): Promise<ResultRow[]> {
    return fetchAll<ResultRow>((start, end) =>
      this.supabase.client
        .from('results')
        .select('id, test_id, session_id, user_id, created_at')
        .eq('session_id', sessionId)
        .order('created_at')
        .order('id')
        .range(start, end),
    );
  }

  private async eventCount(sessionId: string): Promise<number> {
    const { count, error } = await this.supabase.client
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);
    if (error) throw new InternalServerErrorException(error.message);
    return count ?? 0;
  }

  private async sessionData(sessionId: string): Promise<SessionData> {
    const [results, eventCount] = await Promise.all([
      this.sessionResults(sessionId),
      this.eventCount(sessionId),
    ]);
    let comparisonCount = 0;
    if (results.length > 0) {
      const list = results.map((r) => r.id).join(',');
      const { count, error } = await this.supabase.client
        .from('comparisons')
        .select('*', { count: 'exact', head: true })
        .or(`result_id_a.in.(${list}),result_id_b.in.(${list})`);
      if (error) throw new InternalServerErrorException(error.message);
      comparisonCount = count ?? 0;
    }
    return {
      sessionId,
      results: results.map((r) => ({
        id: r.id,
        testId: r.test_id,
        createdAt: r.created_at,
        linkedToAccount: r.user_id != null,
      })),
      comparisonCount,
      eventCount,
    };
  }
}

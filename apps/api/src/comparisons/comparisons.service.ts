import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { bucketByDay, DailyCount } from '../common/bucket-by-day';
import { ResultsService } from '../results/results.service';
import { CreateComparisonDto } from './create-comparison.dto';

export interface ComparisonRow {
  id: string;
  test_id: string;
  result_id_a: string;
  result_id_b: string;
  created_at: string;
}

export interface FindAllComparisonsParams {
  testId?: string;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
}

export interface PaginatedComparisons {
  rows: ComparisonRow[];
  total: number;
}

@Injectable()
export class ComparisonsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly results: ResultsService,
  ) {}

  async create(dto: CreateComparisonDto): Promise<ComparisonRow> {
    const [a, b] = await Promise.all([
      this.results.findById(dto.resultIdA),
      this.results.findById(dto.resultIdB),
    ]);

    if (a.test_id !== b.test_id) {
      throw new BadRequestException('İki sonuç aynı test türüne ait olmalı.');
    }

    const { data, error } = await this.supabase.client
      .from('comparisons')
      .insert({ test_id: a.test_id, result_id_a: a.id, result_id_b: b.id })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data as ComparisonRow;
  }

  async findById(id: string) {
    const { data, error } = await this.supabase.client
      .from('comparisons')
      .select()
      .eq('id', id)
      .single();

    if (error || !data)
      throw new NotFoundException(`Kıyaslama bulunamadı: ${id}`);
    return this.hydrate(data as ComparisonRow);
  }

  /* Davet eden kişinin sonuç sayfası, karşı taraf testi bitirince ortaya
     çıkacak kıyaslamayı bulmak için bunu periyodik olarak yoklar (polling).
     Henüz oluşmadıysa 404 değil null döner — bu beklenen, geçici bir durum. */
  async findByResultId(resultId: string) {
    const asA = await this.supabase.client
      .from('comparisons')
      .select()
      .eq('result_id_a', resultId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (asA.error) throw new InternalServerErrorException(asA.error.message);
    if (asA.data) return this.hydrate(asA.data as ComparisonRow);

    const asB = await this.supabase.client
      .from('comparisons')
      .select()
      .eq('result_id_b', resultId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (asB.error) throw new InternalServerErrorException(asB.error.message);
    if (asB.data) return this.hydrate(asB.data as ComparisonRow);

    return null;
  }

  private async hydrate(row: ComparisonRow) {
    const [a, b] = await Promise.all([
      this.results.findById(row.result_id_a),
      this.results.findById(row.result_id_b),
    ]);
    return { id: row.id, testId: row.test_id, a, b };
  }

  async findAllPaginated(
    params: FindAllComparisonsParams,
  ): Promise<PaginatedComparisons> {
    const { testId, from, to, page, pageSize } = params;
    const offset = (page - 1) * pageSize;

    let query = this.supabase.client
      .from('comparisons')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (testId) query = query.eq('test_id', testId);
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);

    const { data, count, error } = await query;
    if (error) throw new InternalServerErrorException(error.message);

    return { rows: (data ?? []) as ComparisonRow[], total: count ?? 0 };
  }

  async dailyTotalTrend(from?: string, to?: string): Promise<DailyCount[]> {
    let query = this.supabase.client.from('comparisons').select('created_at');
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);

    const { data, error } = await query;
    if (error) throw new InternalServerErrorException(error.message);

    return bucketByDay(data ?? []);
  }
}

import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { computeScores, ScoreResult } from '@struva/shared';
import { SupabaseService } from '../supabase/supabase.service';
import { TestsService } from '../tests/tests.service';
import { SubmitResultDto } from './submit-result.dto';

export interface TestResultCount {
  testId: string;
  count: number;
}

export interface ResultRow {
  id: string;
  test_id: string;
  session_id: string;
  answers: Record<number, number>;
  score: ScoreResult;
  created_at: string;
}

export interface FindAllResultsParams {
  testId?: string;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
}

export interface PaginatedResults {
  rows: ResultRow[];
  total: number;
}

@Injectable()
export class ResultsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly tests: TestsService,
  ) {}

  async submit(dto: SubmitResultDto): Promise<ResultRow> {
    const test = await this.tests.getById(dto.testId); // testId geçersizse NotFoundException fırlatır
    const score = computeScores(test, dto.answers, undefined, dto.contextAnswers);

    const { data, error } = await this.supabase.client
      .from('results')
      .insert({
        test_id: test.id,
        session_id: dto.sessionId,
        answers: dto.answers,
        score,
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data as ResultRow;
  }

  async findById(id: string): Promise<ResultRow> {
    const { data, error } = await this.supabase.client
      .from('results')
      .select()
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException(`Sonuç bulunamadı: ${id}`);
    return data as ResultRow;
  }

  async findBySession(sessionId: string, testId: string, limit = 20): Promise<ResultRow[]> {
    const { data, error } = await this.supabase.client
      .from('results')
      .select()
      .eq('session_id', sessionId)
      .eq('test_id', testId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw new InternalServerErrorException(error.message);
    return (data ?? []) as ResultRow[];
  }

  async findAllPaginated(params: FindAllResultsParams): Promise<PaginatedResults> {
    const { testId, from, to, page, pageSize } = params;
    const offset = (page - 1) * pageSize;

    let query = this.supabase.client
      .from('results')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (testId) query = query.eq('test_id', testId);
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);

    const { data, count, error } = await query;
    if (error) throw new InternalServerErrorException(error.message);

    return { rows: (data ?? []) as ResultRow[], total: count ?? 0 };
  }

  /* Testler DB'de az sayıda (5) olduğundan tek tek count sorgusu — events
     servisindeki countByName ile aynı pragmatik yaklaşım. */
  async countByTest(): Promise<TestResultCount[]> {
    const tests = await this.tests.listAll();
    const counts = await Promise.all(
      tests.map(async (test) => {
        const { count, error } = await this.supabase.client
          .from('results')
          .select('*', { count: 'exact', head: true })
          .eq('test_id', test.id);
        if (error) throw new InternalServerErrorException(error.message);
        return count ?? 0;
      }),
    );
    return tests.map((test, i) => ({ testId: test.id, count: counts[i] }));
  }
}

import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { computeScores, ScoreResult } from '@struva/shared';
import { SupabaseService } from '../supabase/supabase.service';
import { TestsService } from '../tests/tests.service';
import { SubmitResultDto } from './submit-result.dto';

// results tablosu satırı — bkz. supabase/schema.sql
export interface ResultRow {
  id: string;
  test_id: string;
  session_id: string;
  answers: Record<number, number>;
  score: ScoreResult;
  created_at: string;
}

@Injectable()
export class ResultsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly tests: TestsService,
  ) {}

  async submit(dto: SubmitResultDto): Promise<ResultRow> {
    const test = this.tests.getById(dto.testId); // testId geçersizse NotFoundException fırlatır
    const score = computeScores(test, dto.answers);

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

  // Trend grafiği için: aynı oturumun aynı testteki geçmiş sonuçları, eskiden yeniye.
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
}

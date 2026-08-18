import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ResultsService } from '../results/results.service';
import { CreateComparisonDto } from './create-comparison.dto';

export interface ComparisonRow {
  id: string;
  test_id: string;
  result_id_a: string;
  result_id_b: string;
  created_at: string;
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

    if (error || !data) throw new NotFoundException(`Kıyaslama bulunamadı: ${id}`);
    const row = data as ComparisonRow;

    const [a, b] = await Promise.all([
      this.results.findById(row.result_id_a),
      this.results.findById(row.result_id_b),
    ]);

    return { id: row.id, testId: row.test_id, a, b };
  }
}

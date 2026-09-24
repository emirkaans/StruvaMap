import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ResultRow, ResultsService } from '../results/results.service';
import { TestsService } from '../tests/tests.service';
import { SavePredictionDto } from './save-prediction.dto';

export interface PredictionRow {
  result_id: string;
  user_id: string;
  dimensions: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface PredictionDto {
  resultId: string;
  dimensions: Record<string, number>;
  updatedAt: string;
}

@Injectable()
export class PredictionsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly results: ResultsService,
    private readonly tests: TestsService,
  ) {}

  async save(userId: string, dto: SavePredictionDto): Promise<PredictionDto> {
    const result = await this.ownedResult(userId, dto.resultId);

    // Kıyaslama çıktıktan sonra tahmin, gerçek skorlar görülerek
    // "düzeltilebilir" olurdu — isabet ölçümü anlamsızlaşır.
    if (await this.hasComparison(result.id)) {
      throw new ConflictException(
        'Kıyaslama zaten hazır; tahmin artık değiştirilemez.',
      );
    }

    const test = await this.tests.getById(result.test_id);
    this.assertValidDimensions(Object.keys(test.dimensions), dto.dimensions);

    const { data, error } = await this.supabase.client
      .from('predictions')
      .upsert(
        {
          result_id: result.id,
          user_id: userId,
          dimensions: dto.dimensions,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'result_id' },
      )
      .select()
      .single();
    if (error) throw new InternalServerErrorException(error.message);
    return toDto(data as PredictionRow);
  }

  async findMine(
    userId: string,
    resultId: string,
  ): Promise<PredictionDto | null> {
    const result = await this.ownedResult(userId, resultId);
    const { data, error } = await this.supabase.client
      .from('predictions')
      .select()
      .eq('result_id', result.id)
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    return data ? toDto(data as PredictionRow) : null;
  }

  private async ownedResult(
    userId: string,
    resultId: string,
  ): Promise<ResultRow> {
    const result = await this.results.findById(resultId);
    if (result.user_id !== userId)
      throw new ForbiddenException('Bu sonuç sana ait değil.');
    return result;
  }

  private async hasComparison(resultId: string): Promise<boolean> {
    const { data, error } = await this.supabase.client
      .from('comparisons')
      .select('id')
      .or(`result_id_a.eq.${resultId},result_id_b.eq.${resultId}`)
      .limit(1);
    if (error) throw new InternalServerErrorException(error.message);
    return (data ?? []).length > 0;
  }

  private assertValidDimensions(
    expected: string[],
    given: Record<string, unknown>,
  ): void {
    const keys = Object.keys(given);
    const sameKeys =
      keys.length === expected.length &&
      expected.every((dim) => keys.includes(dim));
    if (!sameKeys) {
      throw new BadRequestException(
        `Tahmin tüm boyutları içermeli: ${expected.join(', ')}`,
      );
    }
    for (const [dim, value] of Object.entries(given)) {
      if (
        typeof value !== 'number' ||
        !Number.isInteger(value) ||
        value < 0 ||
        value > 100
      ) {
        throw new BadRequestException(
          `Geçersiz tahmin değeri (${dim}): 0-100 arası tam sayı olmalı.`,
        );
      }
    }
  }
}

function toDto(row: PredictionRow): PredictionDto {
  return {
    resultId: row.result_id,
    dimensions: row.dimensions,
    updatedAt: row.updated_at,
  };
}

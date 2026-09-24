import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  findRelationshipPatterns,
  summarizeRelationshipHistory,
  type RelationshipHistorySummary,
  type LabourWeekSummary,
  type PulseWeekSummary,
  type RelationshipPattern,
  type ScoreResult,
} from '@struva/shared';
import { SupabaseService } from '../supabase/supabase.service';
import { ResultsService } from '../results/results.service';
import { TestsService } from '../tests/tests.service';
import { PairsService } from '../pairs/pairs.service';
import { PulseService } from '../pulse/pulse.service';
import { LabourService } from '../labour/labour.service';
import { AssignResultDto, CreateRelationshipDto } from './relationship.dto';

export interface RelationshipRow {
  id: string;
  user_id: string;
  test_id: string;
  label: string;
  created_at: string;
  pulse_pair_id?: string | null;
}

export interface RelationshipDto {
  id: string;
  testId: string;
  label: string;
  createdAt: string;
}

export interface RelationshipMapNode extends RelationshipDto {
  testName: string;
  resultCount: number;
  latest: {
    resultId: string;
    rsi: number;
    indices: Record<string, number>;
    createdAt: string;
  } | null;
  // Bir önceki sonucun RSI'si — düğümde değişim yönü (↑/↓) için.
  previousRsi: number | null;
  // Bir önceki sonucun endeksleri — örüntülerde "kalıcı" ayrımı için.
  previousIndices?: Record<string, number>;
}

export interface RelationshipDetailResult {
  resultId: string;
  createdAt: string;
  rsi: number;
  dimensions: Record<string, number>;
  indices: Record<string, number>;
}

export interface RelationshipDetailDto extends RelationshipDto {
  testName: string;
  dimensionNames: Record<string, string>;
  indexNames: Record<string, string>;
  // Eskiden yeniye.
  results: RelationshipDetailResult[];
  summary: RelationshipHistorySummary;
  // Bağlı nabız eşleşmesinin son 7 günü ve emek defteri özeti; bağ yoksa null.
  pulse: { pairId: string; week: PulseWeekSummary } | null;
  labour: LabourWeekSummary | null;
  // Bağ yoksa ve kullanıcının aynı test türünde aktif eşleşmesi varsa, bağlanabilecek eşleşme.
  linkablePairId: string | null;
}

export interface RelationshipMapDto {
  relationships: RelationshipMapNode[];
  // Henüz hiçbir ilişkiye bağlanmamış sonuç sayısı — "bağla" çağrısı için.
  unassignedCount: number;
  patterns: RelationshipPattern[];
}

// Harita için bakılan en yeni sonuç sayısı — kullanıcı başına pratikte
// fazlasıyla yeterli; sorguyu sınırlı tutar.
const MAP_RESULT_LIMIT = 200;

interface MapResultRow {
  id: string;
  test_id: string;
  score: ScoreResult;
  created_at: string;
  relationship_id: string | null;
}

@Injectable()
export class RelationshipsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly results: ResultsService,
    private readonly tests: TestsService,
    private readonly pairs: PairsService,
    private readonly pulse: PulseService,
    private readonly labour: LabourService,
  ) {}

  async list(userId: string): Promise<RelationshipDto[]> {
    const { data, error } = await this.supabase.client
      .from('relationships')
      .select()
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) throw new InternalServerErrorException(error.message);
    return ((data ?? []) as RelationshipRow[]).map(toDto);
  }

  async create(
    userId: string,
    dto: CreateRelationshipDto,
  ): Promise<RelationshipDto> {
    await this.tests.getById(dto.testId); // geçersiz testId → NotFoundException
    const { data, error } = await this.supabase.client
      .from('relationships')
      .insert({
        user_id: userId,
        test_id: dto.testId,
        label: cleanLabel(dto.label),
      })
      .select()
      .single();
    if (error) throw new InternalServerErrorException(error.message);
    return toDto(data as RelationshipRow);
  }

  async rename(
    userId: string,
    id: string,
    label: string,
  ): Promise<RelationshipDto> {
    await this.owned(userId, id);
    const { data, error } = await this.supabase.client
      .from('relationships')
      .update({ label: cleanLabel(label) })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new InternalServerErrorException(error.message);
    return toDto(data as RelationshipRow);
  }

  // Bağlı sonuçlar silinmez; FK "on delete set null" ile bağsız kalır.
  async remove(userId: string, id: string): Promise<void> {
    await this.owned(userId, id);
    const { error } = await this.supabase.client
      .from('relationships')
      .delete()
      .eq('id', id);
    if (error) throw new InternalServerErrorException(error.message);
  }

  async assign(
    userId: string,
    dto: AssignResultDto,
  ): Promise<{ resultId: string; relationshipId: string | null }> {
    const result = await this.results.findById(dto.resultId);
    if (result.user_id !== userId)
      throw new ForbiddenException('Bu sonuç sana ait değil.');

    const relationshipId = dto.relationshipId ?? null;
    if (relationshipId) {
      const relationship = await this.owned(userId, relationshipId);
      if (relationship.test_id !== result.test_id) {
        throw new BadRequestException(
          'Sonuç ile ilişki aynı test türünde olmalı.',
        );
      }
    }

    const { error } = await this.supabase.client
      .from('results')
      .update({ relationship_id: relationshipId })
      .eq('id', result.id);
    if (error) throw new InternalServerErrorException(error.message);
    return { resultId: result.id, relationshipId };
  }

  async map(userId: string): Promise<RelationshipMapDto> {
    const [relationships, results, tests] = await Promise.all([
      this.list(userId),
      this.recentResults(userId),
      this.tests.listAll(true),
    ]);
    const testsById = new Map(tests.map((t) => [t.id, t]));

    const nodes: RelationshipMapNode[] = relationships.map((r) => {
      const own = results.filter((row) => row.relationship_id === r.id); // en yeni önce
      const latest = own[0];
      return {
        ...r,
        testName: testsById.get(r.testId)?.name ?? r.testId,
        resultCount: own.length,
        previousRsi: own[1]?.score.rsi ?? null,
        previousIndices: own[1]?.score.indices,
        latest: latest
          ? {
              resultId: latest.id,
              rsi: latest.score.rsi,
              indices: latest.score.indices,
              createdAt: latest.created_at,
            }
          : null,
      };
    });

    const patterns = findRelationshipPatterns(
      nodes.flatMap((n) =>
        n.latest
          ? [
              {
                relationshipId: n.id,
                label: n.label,
                indices: n.latest.indices,
                previousIndices: n.previousIndices,
                indexNames: Object.fromEntries(
                  Object.entries(testsById.get(n.testId)?.indices ?? {}).map(
                    ([id, def]) => [id, def.name],
                  ),
                ),
              },
            ]
          : [],
      ),
    );

    return {
      relationships: nodes,
      unassignedCount: results.filter((row) => !row.relationship_id).length,
      patterns,
    };
  }

  async detail(userId: string, id: string): Promise<RelationshipDetailDto> {
    const row = await this.owned(userId, id);
    const [test, results, linked] = await Promise.all([
      this.tests.getById(row.test_id),
      this.resultsOf(userId, id),
      this.linkedPulse(userId, row),
    ]);

    const points = results.map((r) => ({
      resultId: r.id,
      createdAt: r.created_at,
      rsi: r.score.rsi,
      dimensions: r.score.dimensions,
      indices: r.score.indices,
    }));

    return {
      ...toDto(row),
      testName: test.name,
      dimensionNames: Object.fromEntries(
        Object.entries(test.dimensions).map(([dim, def]) => [dim, def.name]),
      ),
      indexNames: Object.fromEntries(
        Object.entries(test.indices).map(([index, def]) => [index, def.name]),
      ),
      results: points,
      summary: summarizeRelationshipHistory(points),
      ...linked,
    };
  }

  async linkPulse(
    userId: string,
    id: string,
    pairId: string | null,
  ): Promise<RelationshipDto> {
    const row = await this.owned(userId, id);
    if (pairId) {
      const pair = await this.pairs.findById(pairId);
      this.pairs.assertMember(pair, userId);
      if (pair.status !== 'active')
        throw new BadRequestException('Eşleşme henüz kabul edilmedi.');
      if (pair.test_id !== row.test_id) {
        throw new BadRequestException(
          'Eşleşme ile ilişki aynı test türünde olmalı.',
        );
      }
    }
    const { data, error } = await this.supabase.client
      .from('relationships')
      .update({ pulse_pair_id: pairId })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new InternalServerErrorException(error.message);
    return toDto(data as RelationshipRow);
  }

  // En iyi çaba: nabız/emek verisi alınamazsa ilişki detayı yine döner.
  private async linkedPulse(
    userId: string,
    row: RelationshipRow,
  ): Promise<
    Pick<RelationshipDetailDto, 'pulse' | 'labour' | 'linkablePairId'>
  > {
    try {
      if (row.pulse_pair_id) {
        const [history, labour] = await Promise.all([
          this.pulse.getHistory(userId, row.pulse_pair_id, 7),
          this.labour.week(userId, row.pulse_pair_id),
        ]);
        return {
          pulse: { pairId: row.pulse_pair_id, week: history.week },
          labour: labour.week,
          linkablePairId: null,
        };
      }
      const pairs = await this.pairs.findMine(userId);
      const linkable = pairs.find(
        (p) => p.status === 'active' && p.testId === row.test_id,
      );
      return {
        pulse: null,
        labour: null,
        linkablePairId: linkable?.id ?? null,
      };
    } catch {
      return { pulse: null, labour: null, linkablePairId: null };
    }
  }

  private async resultsOf(
    userId: string,
    relationshipId: string,
  ): Promise<MapResultRow[]> {
    const { data, error } = await this.supabase.client
      .from('results')
      .select('id, test_id, score, created_at, relationship_id')
      .eq('user_id', userId)
      .eq('relationship_id', relationshipId)
      .order('created_at', { ascending: true })
      .limit(MAP_RESULT_LIMIT);
    if (error) throw new InternalServerErrorException(error.message);
    return (data ?? []) as MapResultRow[];
  }

  private async recentResults(userId: string): Promise<MapResultRow[]> {
    const { data, error } = await this.supabase.client
      .from('results')
      .select('id, test_id, score, created_at, relationship_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(MAP_RESULT_LIMIT);
    if (error) throw new InternalServerErrorException(error.message);
    return (data ?? []) as MapResultRow[];
  }

  private async owned(userId: string, id: string): Promise<RelationshipRow> {
    const { data, error } = await this.supabase.client
      .from('relationships')
      .select()
      .eq('id', id)
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException('İlişki bulunamadı.');
    const row = data as RelationshipRow;
    if (row.user_id !== userId)
      throw new ForbiddenException('Bu ilişki sana ait değil.');
    return row;
  }
}

function cleanLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) throw new BadRequestException('İlişki adı boş olamaz.');
  return trimmed;
}

function toDto(row: RelationshipRow): RelationshipDto {
  return {
    id: row.id,
    testId: row.test_id,
    label: row.label,
    createdAt: row.created_at,
  };
}

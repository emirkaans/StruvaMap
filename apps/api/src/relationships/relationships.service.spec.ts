import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { RelationshipsService } from './relationships.service';

const rel = (id: string, testId: string, label: string, userId = 'u1') => ({
  id,
  user_id: userId,
  test_id: testId,
  label,
  created_at: '2026-09-01T00:00:00Z',
});

// Tablo bazında sahte Supabase: her sorgu zinciri sonunda tablonun
// verisine çözülür; update çağrıları kaydedilir.
function fakeSupabase(tables: Record<string, unknown[]>) {
  const updates: Array<{ table: string; values: unknown }> = [];
  const from = (table: string) => {
    let rows = tables[table] ?? [];
    const chain: Record<string, unknown> = {
      select: () => chain,
      order: () => chain,
      limit: () => chain,
      eq: (col: string, value: unknown) => {
        rows = rows.filter(
          (r) => (r as Record<string, unknown>)[col] === value,
        );
        return chain;
      },
      maybeSingle: () =>
        Promise.resolve({ data: rows[0] ?? null, error: null }),
      update: (values: unknown) => {
        updates.push({ table, values });
        return chain;
      },
      then: (resolve: (v: unknown) => unknown) =>
        resolve({ data: rows, error: null }),
    };
    return chain;
  };
  return { client: { from }, updates };
}

function makeService(
  tables: Record<string, unknown[]>,
  result = { id: 'r1', test_id: 'romantic', user_id: 'u1' },
) {
  const supabase = fakeSupabase(tables);
  const results = { findById: jest.fn().mockResolvedValue(result) };
  const tests = {
    getById: jest.fn().mockResolvedValue({
      id: 'romantic',
      name: 'Romantik',
      dimensions: { domestic: { name: 'Ev İçi Emek' } },
      indices: { labour: { name: 'Emek' } },
    }),
    listAll: jest.fn().mockResolvedValue([
      {
        id: 'romantic',
        name: 'Romantik',
        indices: { labour: { name: 'Emek' } },
      },
      { id: 'work', name: 'İş', indices: { labour: { name: 'Emek' } } },
    ]),
  };
  const pairs = {
    findMine: jest
      .fn()
      .mockResolvedValue([
        { id: 'pair1', testId: 'romantic', status: 'active' },
      ]),
    findById: jest.fn(),
    assertMember: jest.fn(),
  };
  const service = new RelationshipsService(
    supabase as never,
    results as never,
    tests as never,
    pairs as never,
    {} as never,
    {} as never,
  );
  return { service, supabase };
}

describe('RelationshipsService.assign', () => {
  it('sonucu aynı test türündeki kendi ilişkisine bağlar', async () => {
    const { service, supabase } = makeService({
      relationships: [rel('rel1', 'romantic', 'Ayşe')],
    });
    await expect(
      service.assign('u1', { resultId: 'r1', relationshipId: 'rel1' }),
    ).resolves.toEqual({
      resultId: 'r1',
      relationshipId: 'rel1',
    });
    expect(supabase.updates).toEqual([
      { table: 'results', values: { relationship_id: 'rel1' } },
    ]);
  });

  it('farklı test türüne, başkasının ilişkisine ya da başkasının sonucuna bağlamaz', async () => {
    const { service } = makeService({
      relationships: [
        rel('work1', 'work', 'Patron'),
        rel('other', 'romantic', 'X', 'u2'),
      ],
    });
    await expect(
      service.assign('u1', { resultId: 'r1', relationshipId: 'work1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.assign('u1', { resultId: 'r1', relationshipId: 'other' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.assign('u2', { resultId: 'r1', relationshipId: null }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('RelationshipsService.map', () => {
  it('her ilişkinin en yeni sonucunu ve ilişkiler arası örüntüyü döner', async () => {
    const score = (rsi: number, labour: number) => ({
      rsi,
      indices: { labour },
    });
    const { service } = makeService({
      relationships: [
        rel('rel1', 'romantic', 'Ayşe'),
        rel('rel2', 'work', 'Patron'),
        rel('rel3', 'work', 'Boş'),
      ],
      results: [
        // en yeni önce (servis created_at desc sıralıyor)
        {
          id: 'r3',
          test_id: 'romantic',
          user_id: 'u1',
          score: score(50, 40),
          created_at: '3',
          relationship_id: 'rel1',
        },
        {
          id: 'r2',
          test_id: 'work',
          user_id: 'u1',
          score: score(45, 30),
          created_at: '2',
          relationship_id: 'rel2',
        },
        {
          id: 'r1',
          test_id: 'romantic',
          user_id: 'u1',
          score: score(80, 90),
          created_at: '1',
          relationship_id: 'rel1',
        },
        {
          id: 'r0',
          test_id: 'romantic',
          user_id: 'u1',
          score: score(60, 60),
          created_at: '0',
          relationship_id: null,
        },
      ],
    });

    const map = await service.map('u1');

    expect(
      map.relationships.map((n) => [
        n.label,
        n.resultCount,
        n.latest?.resultId ?? null,
      ]),
    ).toEqual([
      ['Ayşe', 2, 'r3'],
      ['Patron', 1, 'r2'],
      ['Boş', 0, null],
    ]);
    expect(map.relationships[0].testName).toBe('Romantik');
    expect(map.relationships.map((n) => n.previousRsi)).toEqual([
      80,
      null,
      null,
    ]);
    expect(map.unassignedCount).toBe(1);
    expect(map.patterns).toEqual([
      {
        indexId: 'labour',
        indexName: 'Emek',
        kind: 'tension',
        labels: ['Ayşe', 'Patron'],
        persistentLabels: [],
        total: 2,
      },
    ]);
  });
});

describe('RelationshipsService.detail', () => {
  it('ilişkinin sonuçlarını, adları ve geçmiş özetini döner', async () => {
    const score = (rsi: number, domestic: number) => ({
      rsi,
      dimensions: { domestic },
      indices: { labour: domestic },
    });
    const { service } = makeService({
      relationships: [rel('rel1', 'romantic', 'Ayşe')],
      results: [
        {
          id: 'r1',
          user_id: 'u1',
          score: score(45, 30),
          created_at: '2026-01-01',
          relationship_id: 'rel1',
        },
        {
          id: 'r2',
          user_id: 'u1',
          score: score(64, 61),
          created_at: '2026-09-01',
          relationship_id: 'rel1',
        },
        {
          id: 'x',
          user_id: 'u1',
          score: score(10, 10),
          created_at: '2026-05-01',
          relationship_id: 'other',
        },
      ],
    });

    const detail = await service.detail('u1', 'rel1');

    expect(detail.label).toBe('Ayşe');
    expect(detail.dimensionNames).toEqual({ domestic: 'Ev İçi Emek' });
    expect(detail.indexNames).toEqual({ labour: 'Emek' });
    expect(detail.results.map((r) => r.resultId)).toEqual(['r1', 'r2']);
    expect(detail.summary.rsiDelta).toBe(19);
    expect(detail.summary.recovered).toEqual(['domestic']);
    // Bağlı nabız yok; aynı test türündeki aktif eşleşme bağlanmaya aday.
    expect(detail.pulse).toBeNull();
    expect(detail.linkablePairId).toBe('pair1');
  });

  it('başkasının ilişkisini göstermez', async () => {
    const { service } = makeService({
      relationships: [rel('rel1', 'romantic', 'Ayşe', 'u2')],
    });
    await expect(service.detail('u1', 'rel1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

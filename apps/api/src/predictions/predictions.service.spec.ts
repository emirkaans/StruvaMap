import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PredictionsService } from './predictions.service';

const result = {
  id: 'r1',
  test_id: 'romantic',
  user_id: 'user-1',
  score: { dimensions: {} },
};
const dims = {
  decision: 50,
  domestic: 40,
  mental: 60,
  digital: 70,
  social: 80,
  family: 30,
};

// Supabase sorgu zincirinin yalnızca kullanılan halkaları.
function makeService(existingComparisons: unknown[] = []) {
  const upsert = jest.fn().mockReturnValue({
    select: () => ({
      single: () =>
        Promise.resolve({
          data: {
            result_id: 'r1',
            user_id: 'user-1',
            dimensions: dims,
            created_at: 'c',
            updated_at: 'u',
          },
          error: null,
        }),
    }),
  });
  const client = {
    from: jest.fn((table: string) =>
      table === 'comparisons'
        ? {
            select: () => ({
              or: () => ({
                limit: () =>
                  Promise.resolve({ data: existingComparisons, error: null }),
              }),
            }),
          }
        : { upsert },
    ),
  };
  const results = { findById: jest.fn().mockResolvedValue(result) };
  const tests = {
    getById: jest.fn().mockResolvedValue({
      dimensions: Object.fromEntries(Object.keys(dims).map((d) => [d, {}])),
    }),
  };
  const service = new PredictionsService(
    { client } as never,
    results as never,
    tests as never,
  );
  return { service, upsert };
}

describe('PredictionsService.save', () => {
  it('tüm boyutları içeren geçerli tahmini kaydeder', async () => {
    const { service, upsert } = makeService();
    const saved = await service.save('user-1', {
      resultId: 'r1',
      dimensions: dims,
    });
    expect(saved).toEqual({ resultId: 'r1', dimensions: dims, updatedAt: 'u' });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ result_id: 'r1', user_id: 'user-1' }),
      {
        onConflict: 'result_id',
      },
    );
  });

  it('başkasının sonucuna tahmin yazdırmaz', async () => {
    const { service } = makeService();
    await expect(
      service.save('other', { resultId: 'r1', dimensions: dims }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('kıyaslama oluştuktan sonra reddeder', async () => {
    const { service } = makeService([{ id: 'c1' }]);
    await expect(
      service.save('user-1', { resultId: 'r1', dimensions: dims }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('eksik boyutu ya da aralık dışı değeri reddeder', async () => {
    const { service } = makeService();
    const missing = Object.fromEntries(
      Object.entries(dims).filter(([dim]) => dim !== 'family'),
    );
    await expect(
      service.save('user-1', { resultId: 'r1', dimensions: missing }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.save('user-1', {
        resultId: 'r1',
        dimensions: { ...dims, family: 101 },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.save('user-1', {
        resultId: 'r1',
        dimensions: { ...dims, family: 12.5 },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

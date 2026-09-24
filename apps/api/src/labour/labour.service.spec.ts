import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { LabourService } from './labour.service';
import { daysAgoDateString } from '../pulse/pulse-date.util';

const pair = { id: 'p1', user_id_a: 'u1', user_id_b: 'u2', status: 'active' };

function makeService(
  rows: unknown[] = [],
  pairRow: Record<string, unknown> = pair,
) {
  const inserted: unknown[] = [];
  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data: rows, error: null }),
    insert: jest.fn((values: unknown) => {
      inserted.push(values);
      return {
        select: () => ({
          single: () =>
            Promise.resolve({
              data: { id: 'e1', ...(values as object) },
              error: null,
            }),
        }),
      };
    }),
  };
  const pairs = {
    findById: jest.fn().mockResolvedValue(pairRow),
    assertMember: jest.fn((p: typeof pair, userId: string) => {
      if (p.user_id_a !== userId && p.user_id_b !== userId)
        throw new ForbiddenException();
    }),
  };
  const service = new LabourService(
    { client: { from: () => query } } as never,
    pairs as never,
  );
  return { service, inserted };
}

describe('LabourService', () => {
  it('geçerli kategoriyi bugünün tarihiyle kaydeder', async () => {
    const { service, inserted } = makeService();
    const entry = await service.log('u1', 'p1', 'cooking');
    expect(entry).toEqual({
      id: 'e1',
      category: 'cooking',
      date: daysAgoDateString(0),
    });
    expect(inserted).toEqual([
      {
        pair_id: 'p1',
        user_id: 'u1',
        category: 'cooking',
        entry_date: daysAgoDateString(0),
      },
    ]);
  });

  it('geçersiz kategoriyi, üye olmayanı ve kabul edilmemiş eşleşmeyi reddeder', async () => {
    await expect(
      makeService().service.log('u1', 'p1', 'yoga'),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      makeService().service.log('u3', 'p1', 'cooking'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      makeService([], {
        ...pair,
        status: 'pending',
        user_id_b: null,
      }).service.log('u1', 'p1', 'cooking'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('haftalık özeti çağıranın bakış açısından çıkarır, bugünkü kendi kayıtlarını ayırır', async () => {
    const today = daysAgoDateString(0);
    const { service } = makeService([
      { id: 'a', user_id: 'u2', category: 'cooking', entry_date: today },
      {
        id: 'b',
        user_id: 'u2',
        category: 'bills',
        entry_date: daysAgoDateString(2),
      },
      { id: 'c', user_id: 'u2', category: 'cleaning', entry_date: today },
      {
        id: 'd',
        user_id: 'u1',
        category: 'cooking',
        entry_date: daysAgoDateString(1),
      },
    ]);
    const week = await service.week('u2', 'p1');
    expect(week.week.mine).toBe(3);
    expect(week.week.partner).toBe(1);
    expect(week.week.myShare).toBe(75);
    expect(week.todayMine.map((e) => e.id)).toEqual(['a', 'c']);
  });
});

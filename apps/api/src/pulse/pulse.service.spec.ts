import { ForbiddenException } from '@nestjs/common';
import { PulseService, PulseCheckinRow } from './pulse.service';
import { PulsePairRow } from '../pairs/pairs.service';
import { daysAgoDateString } from './pulse-date.util';

const pair: PulsePairRow = {
  id: 'pair-1',
  test_id: 'romantic',
  user_id_a: 'user-a',
  user_id_b: 'user-b',
  invite_code: 'ABC123',
  status: 'active',
  created_at: '2026-09-01T00:00:00Z',
  accepted_at: '2026-09-01T00:00:00Z',
  ended_at: null,
  ended_by: null,
};

function row(
  daysAgo: number,
  answerA: number | null,
  answerB: number | null,
  questionKey = 'romantic-1',
): PulseCheckinRow {
  return {
    id: `c-${daysAgo}`,
    pair_id: pair.id,
    checkin_date: daysAgoDateString(daysAgo),
    question_key: questionKey,
    answer_a: answerA,
    answer_b: answerB,
    answered_a_at: null,
    answered_b_at: null,
    morning_push_sent_at: null,
    evening_notified_a_at: null,
    evening_notified_b_at: null,
  };
}

// Supabase sorgu zinciri (from().select().eq().gte().order()) için en küçük sahte.
function supabaseReturning(rows: PulseCheckinRow[]) {
  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data: rows, error: null }),
  };
  return { client: { from: jest.fn(() => query) }, query };
}

function makeService(rows: PulseCheckinRow[]) {
  const supabase = supabaseReturning(rows);
  const pairs = {
    findById: jest.fn().mockResolvedValue(pair),
    assertMember: jest.fn((p: PulsePairRow, userId: string) => {
      if (p.user_id_a !== userId && p.user_id_b !== userId)
        throw new ForbiddenException();
    }),
  };
  const service = new PulseService(
    supabase as never,
    pairs as never,
    {} as never,
    {} as never,
  );
  return { service, supabase };
}

describe('PulseService.getHistory', () => {
  it('cevapları çağıranın bakış açısına çevirir ve haftayı son 7 günle sınırlar', async () => {
    const { service, supabase } = makeService([
      row(10, 1, 1), // haftanın dışında
      row(3, 4, 2, 'romantic-4'),
      row(0, 5, null),
    ]);

    const asB = await service.getHistory('user-b', pair.id, 28);

    expect(supabase.query.gte).toHaveBeenCalledWith(
      'checkin_date',
      daysAgoDateString(27),
    );
    expect(asB.days).toHaveLength(3);
    expect(asB.days[1]).toEqual({
      date: daysAgoDateString(3),
      questionText: 'Bugün duyulduğunu hissettin mi?',
      myAnswer: 2,
      partnerAnswer: 4,
    });
    expect(asB.week.answeredDays).toBe(1);
    expect(asB.week.bothAnsweredDays).toBe(1);
    expect(asB.week.partnerAverage).toBe(4.5);
    expect(asB.week.gapDays).toBe(1);
  });

  it('pair üyesi olmayanı reddeder', async () => {
    const { service } = makeService([]);
    await expect(
      service.getHistory('stranger', pair.id),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import {
  findPulseQuestionById,
  pickPulseQuestion,
  summarizePulseWeek,
  type PulseHistoryEntry,
  type PulseWeekSummary,
} from '@struva/shared';
import { SupabaseService } from '../supabase/supabase.service';
import { PairsService, PulsePairRow } from '../pairs/pairs.service';
import { DevicesService } from '../devices/devices.service';
import { PushService } from '../push/push.service';
import { daysAgoDateString, todayDateString } from './pulse-date.util';

export interface PulseCheckinRow {
  id: string;
  pair_id: string;
  checkin_date: string;
  question_key: string;
  answer_a: number | null;
  answer_b: number | null;
  answered_a_at: string | null;
  answered_b_at: string | null;
  morning_push_sent_at: string | null;
  evening_notified_a_at: string | null;
  evening_notified_b_at: string | null;
}

export interface PulseTodayDto {
  id: string;
  pairId: string;
  questionText: string;
  myAnswer: number | null;
  partnerAnswered: boolean;
  partnerAnswer: number | null;
}

export interface PulseHistoryDayDto {
  date: string;
  questionText: string;
  myAnswer: number | null;
  partnerAnswer: number | null;
}

export interface PulseHistoryDto {
  pairId: string;
  // Tarih artan sırada, yalnızca satırı olan günler — boş günleri takvim
  // (istemci) dolduruyor.
  days: PulseHistoryDayDto[];
  // Bugün dahil son 7 gün (bkz. WEEK_DAYS).
  week: PulseWeekSummary;
}

const DEFAULT_HISTORY_DAYS = 28;
const WEEK_DAYS = 7;

@Injectable()
export class PulseService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly pairs: PairsService,
    private readonly devices: DevicesService,
    private readonly push: PushService,
  ) {}

  async getToday(userId: string, pairId: string): Promise<PulseTodayDto> {
    const pair = await this.pairs.findById(pairId);
    this.pairs.assertMember(pair, userId);

    const row = await this.findOrCreateToday(pair);
    return this.toDto(row, pair, userId);
  }

  async getHistory(userId: string, pairId: string, days = DEFAULT_HISTORY_DAYS): Promise<PulseHistoryDto> {
    const pair = await this.pairs.findById(pairId);
    this.pairs.assertMember(pair, userId);

    const entries = await this.findEntries(pair, userId, days);
    const weekStart = daysAgoDateString(WEEK_DAYS - 1);

    return {
      pairId: pair.id,
      days: entries.map((e) => ({
        date: e.date,
        questionText: findPulseQuestionById(pair.test_id, e.questionKey)?.text ?? 'Bugün nasıl geçti?',
        myAnswer: e.myAnswer,
        partnerAnswer: e.partnerAnswer,
      })),
      week: summarizePulseWeek(
        pair.test_id,
        entries.filter((e) => e.date >= weekStart),
      ),
    };
  }

  // Haftalık özet push'u da (bkz. pulse-cron.service.ts) aynı sorguyu
  // kullanıyor — kullanıcının bakış açısına (A/B → my/partner) çevrilmiş.
  async findEntries(pair: PulsePairRow, userId: string, days: number): Promise<PulseHistoryEntry[]> {
    const { data, error } = await this.supabase.client
      .from('pulse_checkins')
      .select()
      .eq('pair_id', pair.id)
      .gte('checkin_date', daysAgoDateString(days - 1))
      .order('checkin_date', { ascending: true });
    if (error) throw new InternalServerErrorException(error.message);

    const isA = pair.user_id_a === userId;
    return ((data ?? []) as PulseCheckinRow[]).map((row) => ({
      date: row.checkin_date,
      questionKey: row.question_key,
      myAnswer: (isA ? row.answer_a : row.answer_b) ?? null,
      partnerAnswer: (isA ? row.answer_b : row.answer_a) ?? null,
    }));
  }

  async submitAnswer(userId: string, checkinId: string, answer: number): Promise<PulseTodayDto> {
    const { data, error } = await this.supabase.client
      .from('pulse_checkins')
      .select()
      .eq('id', checkinId)
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException('Check-in bulunamadı.');

    const row = data as PulseCheckinRow;
    const pair = await this.pairs.findById(row.pair_id);
    this.pairs.assertMember(pair, userId);
    const isA = pair.user_id_a === userId;

    const update = isA
      ? { answer_a: answer, answered_a_at: new Date().toISOString() }
      : { answer_b: answer, answered_b_at: new Date().toISOString() };

    const { data: updated, error: updateError } = await this.supabase.client
      .from('pulse_checkins')
      .update(update)
      .eq('id', checkinId)
      .select()
      .single();
    if (updateError) throw new InternalServerErrorException(updateError.message);
    const updatedRow = updated as PulseCheckinRow;

    // En iyi çaba: anlık push başarısız olsa da akşam cron'u yine de
    // yakalar (bkz. pulse-cron.service.ts runEveningJob) — burada fırlatmıyoruz.
    void this.notifyPartnerIfUnanswered(pair, updatedRow, isA);

    return this.toDto(updatedRow, pair, userId);
  }

  private async notifyPartnerIfUnanswered(pair: PulsePairRow, row: PulseCheckinRow, answeredByA: boolean): Promise<void> {
    if (!pair.user_id_b) return;

    const partnerAnswered = answeredByA ? row.answer_b != null : row.answer_a != null;
    if (partnerAnswered) return;

    const partnerId = answeredByA ? pair.user_id_b : pair.user_id_a;
    const notifiedField = answeredByA ? 'evening_notified_b_at' : 'evening_notified_a_at';
    if ((row as unknown as Record<string, unknown>)[notifiedField]) return;

    const token = await this.devices.getTokenForUser(partnerId);
    if (!token) return;

    const question = findPulseQuestionById(pair.test_id, row.question_key);
    await this.push.sendPulseReady(token, pair.id, 'partner_answered', 'Partnerin yanıtladı', question?.text ?? 'Bugünkü nabız sorusuna sen de bakabilirsin.', {
      checkinId: row.id,
    });

    await this.supabase.client
      .from('pulse_checkins')
      .update({ [notifiedField]: new Date().toISOString() })
      .eq('id', row.id);
  }

  private async findOrCreateToday(pair: PulsePairRow): Promise<PulseCheckinRow> {
    const today = todayDateString();

    const { data: existing, error } = await this.supabase.client
      .from('pulse_checkins')
      .select()
      .eq('pair_id', pair.id)
      .eq('checkin_date', today)
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    if (existing) return existing as PulseCheckinRow;

    // Normalde sabah cron'u (bkz. pulse-cron.service.ts) satırı zaten
    // oluşturur — bu, cron henüz çalışmadıysa/yeni pair ise güvenlik ağı.
    const question = pickPulseQuestion(pair.test_id, new Date(today));
    const { data: created, error: insertError } = await this.supabase.client
      .from('pulse_checkins')
      .insert({ pair_id: pair.id, checkin_date: today, question_key: question?.id ?? 'default' })
      .select()
      .single();

    if (insertError) {
      // Yarış durumu: aynı anda iki istek create etmeye çalıştı, unique
      // index (pair_id, checkin_date) ikincisini reddetti — var olanı çek.
      const { data: raceExisting } = await this.supabase.client
        .from('pulse_checkins')
        .select()
        .eq('pair_id', pair.id)
        .eq('checkin_date', today)
        .maybeSingle();
      if (raceExisting) return raceExisting as PulseCheckinRow;
      throw new InternalServerErrorException(insertError.message);
    }
    return created as PulseCheckinRow;
  }

  private toDto(row: PulseCheckinRow, pair: PulsePairRow, userId: string): PulseTodayDto {
    const isA = pair.user_id_a === userId;
    const myAnswer = isA ? row.answer_a : row.answer_b;
    const partnerAnswer = isA ? row.answer_b : row.answer_a;
    const question = findPulseQuestionById(pair.test_id, row.question_key);

    return {
      id: row.id,
      pairId: pair.id,
      questionText: question?.text ?? 'Bugün nasıl geçti?',
      myAnswer: myAnswer ?? null,
      partnerAnswered: partnerAnswer != null,
      partnerAnswer: partnerAnswer ?? null,
    };
  }
}

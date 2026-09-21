import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { pickPulseQuestion } from '@struva/shared';
import { SupabaseService } from '../supabase/supabase.service';
import { PairsService, PulsePairRow } from '../pairs/pairs.service';
import { DevicesService } from '../devices/devices.service';
import { PushService } from '../push/push.service';
import { PulseCheckinRow } from './pulse.service';
import { todayDateString } from './pulse-date.util';

// Render'da servis her zaman-açık (always-on) planda çalışmalı — idle
// spin-down'da process durur, cron hiç tetiklenmez (bkz. plan notu).
// Tek instance varsayımıyla yazıldı; yatay ölçeklenirse push'un iki kez
// gitme riski var (küçük bir pencere, DB unique index çift satırı engeller).
@Injectable()
export class PulseCronService {
  private readonly logger = new Logger(PulseCronService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly pairs: PairsService,
    private readonly devices: DevicesService,
    private readonly push: PushService,
  ) {}

  @Cron('0 8 * * *')
  async sendMorningPulses(): Promise<void> {
    await this.runMorningJob();
  }

  @Cron('0 19 * * *')
  async sendEveningReminders(): Promise<void> {
    await this.runEveningJob();
  }

  async runMorningJob(): Promise<void> {
    const activePairs = await this.pairs.findAllActive();
    for (const pair of activePairs) {
      try {
        await this.ensureTodayCheckinAndNotify(pair);
      } catch (error) {
        this.logger.warn(`Sabah push'u başarısız (pair ${pair.id}): ${(error as Error).message}`);
      }
    }
  }

  async runEveningJob(): Promise<void> {
    const today = todayDateString();
    const { data, error } = await this.supabase.client
      .from('pulse_checkins')
      .select()
      .eq('checkin_date', today);
    if (error) {
      this.logger.warn(`Akşam push sorgusu başarısız: ${error.message}`);
      return;
    }

    for (const row of (data ?? []) as PulseCheckinRow[]) {
      try {
        await this.notifyEveningForRow(row);
      } catch (error) {
        this.logger.warn(`Akşam push'u başarısız (checkin ${row.id}): ${(error as Error).message}`);
      }
    }
  }

  private async ensureTodayCheckinAndNotify(pair: PulsePairRow): Promise<void> {
    if (!pair.user_id_b) return; // henüz kabul edilmemiş davet
    const today = todayDateString();

    const { data: existing, error } = await this.supabase.client
      .from('pulse_checkins')
      .select()
      .eq('pair_id', pair.id)
      .eq('checkin_date', today)
      .maybeSingle();
    if (error) throw new Error(error.message);

    let row = existing as PulseCheckinRow | null;
    if (!row) {
      const question = pickPulseQuestion(pair.test_id, new Date(today));
      const { data: created, error: insertError } = await this.supabase.client
        .from('pulse_checkins')
        .insert({ pair_id: pair.id, checkin_date: today, question_key: question?.id ?? 'default' })
        .select()
        .single();

      if (insertError) {
        const { data: raceExisting } = await this.supabase.client
          .from('pulse_checkins')
          .select()
          .eq('pair_id', pair.id)
          .eq('checkin_date', today)
          .maybeSingle();
        if (!raceExisting) throw new Error(insertError.message);
        row = raceExisting as PulseCheckinRow;
      } else {
        row = created as PulseCheckinRow;
      }
    }

    if (row.morning_push_sent_at) return;

    const [tokenA, tokenB] = await Promise.all([
      this.devices.getTokenForUser(pair.user_id_a),
      this.devices.getTokenForUser(pair.user_id_b),
    ]);

    const title = 'Bugünkü nabız hazır';
    const body = 'Partnerinle günlük check-in seni bekliyor.';
    if (tokenA) await this.push.sendPulseReady(tokenA, pair.id, 'morning', title, body);
    if (tokenB) await this.push.sendPulseReady(tokenB, pair.id, 'morning', title, body);

    await this.supabase.client
      .from('pulse_checkins')
      .update({ morning_push_sent_at: new Date().toISOString() })
      .eq('id', row.id);
  }

  private async notifyEveningForRow(row: PulseCheckinRow): Promise<void> {
    const pair = await this.pairs.findById(row.pair_id);
    if (!pair.user_id_b) return;

    const targets: Array<{
      userId: string;
      answered: boolean;
      alreadyNotified: boolean;
      field: 'evening_notified_a_at' | 'evening_notified_b_at';
    }> = [
      {
        userId: pair.user_id_a,
        answered: row.answer_a != null,
        alreadyNotified: row.evening_notified_a_at != null,
        field: 'evening_notified_a_at',
      },
      {
        userId: pair.user_id_b,
        answered: row.answer_b != null,
        alreadyNotified: row.evening_notified_b_at != null,
        field: 'evening_notified_b_at',
      },
    ];

    for (const target of targets) {
      if (target.answered || target.alreadyNotified) continue;

      const token = await this.devices.getTokenForUser(target.userId);
      if (!token) continue;

      const partnerAnswered = target.field === 'evening_notified_a_at' ? row.answer_b != null : row.answer_a != null;
      const body = partnerAnswered
        ? 'Partnerin yanıtladı, bugünkü nabza sen de bak.'
        : 'Bugünkü nabız sorusunu henüz yanıtlamadın.';

      await this.push.sendPulseReady(token, pair.id, 'partner_answered', 'Bugünün nabzı', body);
      await this.supabase.client
        .from('pulse_checkins')
        .update({ [target.field]: new Date().toISOString() })
        .eq('id', row.id);
    }
  }
}

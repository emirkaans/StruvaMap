import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  isLabourCategory,
  LABOUR_CATEGORIES,
  summarizeLabourWeek,
  type LabourCategory,
  type LabourWeekSummary,
} from '@struva/shared';
import { SupabaseService } from '../supabase/supabase.service';
import { PairsService, PulsePairRow } from '../pairs/pairs.service';
import { daysAgoDateString, todayDateString } from '../pulse/pulse-date.util';

export interface LabourEntryRow {
  id: string;
  pair_id: string;
  user_id: string;
  category: string;
  entry_date: string;
  created_at: string;
}

export interface LabourEntryDto {
  id: string;
  category: string;
  date: string;
}

export interface LabourWeekDto {
  categories: LabourCategory[];
  // Bugün dahil son 7 gün.
  week: LabourWeekSummary;
  // Kullanıcının bugünkü kendi kayıtları (en yeni önce) — "geri al" için.
  todayMine: LabourEntryDto[];
}

const WEEK_DAYS = 7;

@Injectable()
export class LabourService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly pairs: PairsService,
  ) {}

  async log(
    userId: string,
    pairId: string,
    category: string,
  ): Promise<LabourEntryDto> {
    await this.activePairOf(userId, pairId);
    if (!isLabourCategory(category))
      throw new BadRequestException('Geçersiz emek kategorisi.');

    const { data, error } = await this.supabase.client
      .from('labour_entries')
      .insert({
        pair_id: pairId,
        user_id: userId,
        category,
        entry_date: todayDateString(),
      })
      .select()
      .single();
    if (error) throw new InternalServerErrorException(error.message);
    return toDto(data as LabourEntryRow);
  }

  // Yalnızca kendi kaydını silebilir (partnerin kaydı onun beyanı).
  async remove(userId: string, id: string): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('labour_entries')
      .select()
      .eq('id', id)
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException('Kayıt bulunamadı.');
    if ((data as LabourEntryRow).user_id !== userId)
      throw new ForbiddenException('Bu kayıt sana ait değil.');

    const { error: deleteError } = await this.supabase.client
      .from('labour_entries')
      .delete()
      .eq('id', id);
    if (deleteError)
      throw new InternalServerErrorException(deleteError.message);
  }

  async week(userId: string, pairId: string): Promise<LabourWeekDto> {
    await this.activePairOf(userId, pairId);

    const { data, error } = await this.supabase.client
      .from('labour_entries')
      .select()
      .eq('pair_id', pairId)
      .gte('entry_date', daysAgoDateString(WEEK_DAYS - 1))
      .order('created_at', { ascending: false });
    if (error) throw new InternalServerErrorException(error.message);
    const rows = (data ?? []) as LabourEntryRow[];

    const today = todayDateString();
    return {
      categories: LABOUR_CATEGORIES,
      week: summarizeLabourWeek(
        rows.map((r) => ({ category: r.category, mine: r.user_id === userId })),
      ),
      todayMine: rows
        .filter((r) => r.user_id === userId && r.entry_date === today)
        .map(toDto),
    };
  }

  private async activePairOf(
    userId: string,
    pairId: string,
  ): Promise<PulsePairRow> {
    const pair = await this.pairs.findById(pairId);
    this.pairs.assertMember(pair, userId);
    if (pair.status !== 'active')
      throw new BadRequestException(
        'Emek defteri eşleşme kabul edilince açılır.',
      );
    return pair;
  }
}

function toDto(row: LabourEntryRow): LabourEntryDto {
  return { id: row.id, category: row.category, date: row.entry_date };
}

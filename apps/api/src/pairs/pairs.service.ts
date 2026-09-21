import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PULSE_QUESTIONS } from '@struva/shared';
import { SupabaseService } from '../supabase/supabase.service';

export interface PulsePairRow {
  id: string;
  test_id: string;
  user_id_a: string;
  user_id_b: string | null;
  invite_code: string;
  status: 'pending' | 'active';
  created_at: string;
  accepted_at: string | null;
}

export interface PairDto {
  id: string;
  testId: string;
  status: 'pending' | 'active';
  inviteCode: string;
  partnerUsername: string | null;
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 0/O, 1/I gibi karışabilecek karakterler çıkarıldı
const CODE_LENGTH = 6;
const MAX_CODE_ATTEMPTS = 5;

function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

@Injectable()
export class PairsService {
  constructor(private readonly supabase: SupabaseService) {}

  async createInvite(userId: string, testId: string): Promise<PairDto> {
    if (!PULSE_QUESTIONS[testId] || PULSE_QUESTIONS[testId].length === 0) {
      throw new BadRequestException('Bu test türü için henüz günlük nabız sorusu tanımlı değil.');
    }

    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
      const inviteCode = generateInviteCode();
      const { data, error } = await this.supabase.client
        .from('pulse_pairs')
        .insert({ test_id: testId, user_id_a: userId, invite_code: inviteCode })
        .select()
        .single();

      if (!error) return this.toDto(data as PulsePairRow, userId);
      // Kod çakışması (unique_violation) — yeniden dene, başka hatada fırlat.
      if (error.code !== '23505') throw new InternalServerErrorException(error.message);
    }

    throw new InternalServerErrorException('Davet kodu üretilemedi, tekrar dene.');
  }

  async accept(userId: string, inviteCode: string): Promise<PairDto> {
    const { data, error } = await this.supabase.client
      .from('pulse_pairs')
      .select()
      .eq('invite_code', inviteCode.toUpperCase())
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException('Davet kodu bulunamadı.');

    const row = data as PulsePairRow;
    if (row.status !== 'pending') throw new BadRequestException('Bu davet kodu zaten kullanılmış.');
    if (row.user_id_a === userId) throw new BadRequestException('Kendi davetini kabul edemezsin.');

    const { data: updated, error: updateError } = await this.supabase.client
      .from('pulse_pairs')
      .update({ user_id_b: userId, status: 'active', accepted_at: new Date().toISOString() })
      .eq('id', row.id)
      .eq('status', 'pending') // yarış durumu: iki kişi aynı anda kabul etmeye çalışırsa ikincisi 0 satır günceller
      .select()
      .maybeSingle();
    if (updateError) throw new InternalServerErrorException(updateError.message);
    if (!updated) throw new BadRequestException('Bu davet kodu az önce kullanıldı.');

    return this.toDto(updated as PulsePairRow, userId);
  }

  async findMine(userId: string): Promise<PairDto[]> {
    const { data, error } = await this.supabase.client
      .from('pulse_pairs')
      .select()
      .or(`user_id_a.eq.${userId},user_id_b.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error) throw new InternalServerErrorException(error.message);

    const rows = (data ?? []) as PulsePairRow[];
    return Promise.all(rows.map((row) => this.toDto(row, userId)));
  }

  async findById(id: string): Promise<PulsePairRow> {
    const { data, error } = await this.supabase.client
      .from('pulse_pairs')
      .select()
      .eq('id', id)
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException('Eşleşme bulunamadı.');
    return data as PulsePairRow;
  }

  async findAllActive(): Promise<PulsePairRow[]> {
    const { data, error } = await this.supabase.client
      .from('pulse_pairs')
      .select()
      .eq('status', 'active');
    if (error) throw new InternalServerErrorException(error.message);
    return (data ?? []) as PulsePairRow[];
  }

  assertMember(pair: PulsePairRow, userId: string): void {
    if (pair.user_id_a !== userId && pair.user_id_b !== userId) {
      throw new ForbiddenException('Bu eşleşmeye erişimin yok.');
    }
  }

  private async toDto(row: PulsePairRow, callerId: string): Promise<PairDto> {
    const partnerId = row.user_id_a === callerId ? row.user_id_b : row.user_id_a;
    const partnerUsername = partnerId ? await this.getUsername(partnerId) : null;
    return {
      id: row.id,
      testId: row.test_id,
      status: row.status,
      inviteCode: row.invite_code,
      partnerUsername,
    };
  }

  private async getUsername(userId: string): Promise<string | null> {
    const { data } = await this.supabase.client
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .maybeSingle();
    return data?.username ?? null;
  }
}

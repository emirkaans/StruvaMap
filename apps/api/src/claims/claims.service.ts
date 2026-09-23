import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { SupabaseService } from '../supabase/supabase.service';

const CLAIM_TTL_MS = 48 * 60 * 60 * 1000; // 48 saat

export interface ClaimTokenRow {
  token: string;
  result_id: string;
  expires_at: string;
  claimed_at: string | null;
  created_at: string;
}

@Injectable()
export class ClaimsService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(resultId: string): Promise<{ token: string; expiresAt: string }> {
    const { data: result, error: resultError } = await this.supabase.client
      .from('results')
      .select('id')
      .eq('id', resultId)
      .maybeSingle();
    if (resultError) throw new InternalServerErrorException(resultError.message);
    if (!result) throw new NotFoundException('Sonuç bulunamadı.');

    // 24 byte / base64url ≈ 32 karakter — pairs.service.ts'teki 6 haneli davet
    // koduyla karıştırılmasın: o insan eliyle yazılıyor, bu panodan makineden
    // makineye taşınıyor, tahmin edilebilirlik burada tek savunma.
    const token = randomBytes(24).toString('base64url');
    const expiresAt = new Date(Date.now() + CLAIM_TTL_MS).toISOString();

    const { error } = await this.supabase.client
      .from('claim_tokens')
      .insert({ token, result_id: resultId, expires_at: expiresAt });
    if (error) throw new InternalServerErrorException(error.message);

    return { token, expiresAt };
  }

  async redeem(userId: string, token: string): Promise<{ resultId: string }> {
    const { data, error } = await this.supabase.client
      .from('claim_tokens')
      .select()
      .eq('token', token)
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException('Kod bulunamadı.');

    const row = data as ClaimTokenRow;
    if (row.claimed_at) throw new BadRequestException('Bu kod zaten kullanılmış.');
    if (new Date(row.expires_at).getTime() < Date.now()) {
      throw new BadRequestException('Kodun süresi dolmuş.');
    }

    // Yarış durumu: aynı token aynı anda iki kez redeem edilmeye çalışılırsa
    // (bkz. pairs.service.ts accept() ile aynı desen) yalnızca biri eşleşir —
    // .select() boş dönerse diğer istek kazanmış demektir.
    const { data: updated, error: updateError } = await this.supabase.client
      .from('claim_tokens')
      .update({ claimed_at: new Date().toISOString() })
      .eq('token', token)
      .is('claimed_at', null)
      .select()
      .maybeSingle();
    if (updateError) throw new InternalServerErrorException(updateError.message);
    if (!updated) throw new BadRequestException('Bu kod az önce kullanıldı.');

    const { error: resultError } = await this.supabase.client
      .from('results')
      .update({ user_id: userId })
      .eq('id', row.result_id);
    if (resultError) throw new InternalServerErrorException(resultError.message);

    return { resultId: row.result_id };
  }
}

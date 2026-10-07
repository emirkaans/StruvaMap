import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
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

  async create(
    resultId: string,
    sessionId: string,
  ): Promise<{ token: string; expiresAt: string }> {
    // Sonuç id'si paylaşılan linklerde açık; sahiplik kanıtı oturum kimliği.
    // Başka tarayıcının sonucu da "bulunamadı" döner, sonucun varlığı belli
    // edilmez. Zaten bir hesaba bağlı sonuç için kod üretilmez.
    const { data: result, error: resultError } = await this.supabase.client
      .from('results')
      .select('id, user_id')
      .eq('id', resultId)
      .eq('session_id', sessionId)
      .maybeSingle();
    if (resultError)
      throw new InternalServerErrorException(resultError.message);
    if (!result) throw new NotFoundException('Sonuç bulunamadı.');
    if (result.user_id)
      throw new ConflictException('Bu sonuç zaten bir hesaba bağlı.');

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
    if (row.claimed_at)
      throw new BadRequestException('Bu kod zaten kullanılmış.');
    if (new Date(row.expires_at).getTime() < Date.now()) {
      throw new BadRequestException('Kodun süresi dolmuş.');
    }

    // Kod üretildikten sonra sonuç başka yoldan bir hesaba bağlanmış olabilir.
    // Bu durumda kodu yakmadan reddet; aynı hesapsa işlem zaten tamam.
    const { data: result, error: ownerError } = await this.supabase.client
      .from('results')
      .select('user_id')
      .eq('id', row.result_id)
      .maybeSingle();
    if (ownerError) throw new InternalServerErrorException(ownerError.message);
    if (!result) throw new NotFoundException('Sonuç bulunamadı.');
    if (result.user_id === userId) return { resultId: row.result_id };
    if (result.user_id)
      throw new ConflictException('Bu sonuç zaten bir hesaba bağlı.');

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
    if (updateError)
      throw new InternalServerErrorException(updateError.message);
    if (!updated) throw new BadRequestException('Bu kod az önce kullanıldı.');

    // Yalnızca hâlâ sahipsizse bağla: kontrol ile güncelleme arasında başka
    // biri sonucu almışsa 0 satır güncellenir, mevcut sahibin sonucu korunur.
    const { data: claimed, error: resultError } = await this.supabase.client
      .from('results')
      .update({ user_id: userId })
      .eq('id', row.result_id)
      .is('user_id', null)
      .select('id')
      .maybeSingle();
    if (resultError)
      throw new InternalServerErrorException(resultError.message);
    if (!claimed)
      throw new ConflictException('Bu sonuç zaten bir hesaba bağlı.');

    return { resultId: row.result_id };
  }
}

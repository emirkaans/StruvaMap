import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { RegisterDeviceDto } from './register-device.dto';

@Injectable()
export class DevicesService {
  constructor(private readonly supabase: SupabaseService) {}

  async register(dto: RegisterDeviceDto): Promise<void> {
    const { error } = await this.supabase.client
      .from('push_tokens')
      .upsert({ result_id: dto.resultId, fcm_token: dto.fcmToken });
    if (error) throw new InternalServerErrorException(error.message);
  }

  async getToken(resultId: string): Promise<string | null> {
    const { data, error } = await this.supabase.client
      .from('push_tokens')
      .select('fcm_token')
      .eq('result_id', resultId)
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    return data?.fcm_token ?? null;
  }

  // Kalıcı, kullanıcı bazlı token — push_tokens (result_id bazlı, tek
  // kullanımlık) ile karıştırılmasın diye ayrı tablo (user_push_tokens).
  // Nabız check-in bildirimleri (sabah/akşam cron) bunu kullanır.
  async registerForUser(userId: string, fcmToken: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('user_push_tokens')
      .upsert({ user_id: userId, fcm_token: fcmToken, updated_at: new Date().toISOString() });
    if (error) throw new InternalServerErrorException(error.message);
  }

  async getTokenForUser(userId: string): Promise<string | null> {
    const { data, error } = await this.supabase.client
      .from('user_push_tokens')
      .select('fcm_token')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    return data?.fcm_token ?? null;
  }
}

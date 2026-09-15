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
}

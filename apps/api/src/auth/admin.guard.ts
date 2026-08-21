import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { User } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';

export interface AdminRequest extends Request {
  adminUser: User;
}

/* Şimdilik rol tablosu yok: her geçerli Supabase oturumu admin sayılır.
   Uygulamada herkese açık kayıt akışı olmadığı sürece güvenli — mobil
   kullanıcı girişi eklendiğinde tek değişecek yer burası. */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

    if (!token) throw new UnauthorizedException('Yetkilendirme başlığı eksik.');

    const { data, error } = await this.supabase.client.auth.getUser(token);
    if (error || !data.user) throw new UnauthorizedException('Oturum geçersiz.');

    request.adminUser = data.user;
    return true;
  }
}

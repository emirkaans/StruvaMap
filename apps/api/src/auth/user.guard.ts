import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { User } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';

export interface AuthedRequest extends Request {
  user: User;
}

// AdminGuard'ın allowlist'siz hali: geçerli bir Supabase oturumu yeterli.
// Mobil (kullanıcı adı+şifre ile giriş) uçları burayı kullanır.
@Injectable()
export class UserGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

    if (!token) throw new UnauthorizedException('Yetkilendirme başlığı eksik.');

    const { data, error } = await this.supabase.client.auth.getUser(token);
    if (error || !data.user) throw new UnauthorizedException('Oturum geçersiz.');

    request.user = data.user;
    return true;
  }
}

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { User } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';

export interface AdminRequest extends Request {
  adminUser: User;
}

/* Rol tablosu yok; yetki ADMIN_EMAILS allowlist'i ile sınırlanır. Supabase
   projesinde herkese açık signUp API seviyesinde kapalı değilse, anon key
   frontend bundle'ında görünür olduğundan kimliği doğrulanmış her hesap
   geçerli bir oturum üretebilir — bu yüzden sadece geçerli oturum yeterli
   değildir, e-posta allowlist'te olmalıdır. */
@Injectable()
export class AdminGuard implements CanActivate {
  private readonly adminEmails: Set<string>;

  constructor(
    private readonly supabase: SupabaseService,
    config: ConfigService,
  ) {
    this.adminEmails = new Set(
      config
        .getOrThrow<string>('ADMIN_EMAILS')
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

    if (!token) throw new UnauthorizedException('Yetkilendirme başlığı eksik.');

    const { data, error } = await this.supabase.client.auth.getUser(token);
    if (error || !data.user) throw new UnauthorizedException('Oturum geçersiz.');

    const email = data.user.email?.toLowerCase();
    if (!email || !this.adminEmails.has(email)) {
      throw new UnauthorizedException('Bu hesabın admin yetkisi yok.');
    }

    request.adminUser = data.user;
    return true;
  }
}

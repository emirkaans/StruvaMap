import { BadRequestException, Body, ConflictException, Controller, InternalServerErrorException, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SupabaseService } from '../supabase/supabase.service';
import { RegisterDto } from './register.dto';
import { usernameToEmail } from './username.util';

@Controller('auth')
export class AuthController {
  constructor(private readonly supabase: SupabaseService) {}

  // Mobil kayıt: kullanıcı adı+şifre. Oturum açma bu uçtan dönmez — kayıt
  // başarılı olduktan sonra istemci kendi Supabase SDK'sıyla aynı sentetik
  // e-postayla signInWithPassword çağırır (token/refresh yönetimi SDK'da kalsın).
  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async register(@Body() dto: RegisterDto) {
    const username = dto.username.toLowerCase();

    const { data: existing } = await this.supabase.client
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();
    if (existing) throw new ConflictException('Bu kullanıcı adı zaten alınmış.');

    const { data: created, error: createError } = await this.supabase.client.auth.admin.createUser({
      email: usernameToEmail(username),
      password: dto.password,
      email_confirm: true,
      user_metadata: { username },
    });
    if (createError || !created.user) {
      throw new BadRequestException(createError?.message ?? 'Kayıt oluşturulamadı.');
    }

    const { error: profileError } = await this.supabase.client
      .from('profiles')
      .insert({ id: created.user.id, username });
    if (profileError) {
      await this.supabase.client.auth.admin.deleteUser(created.user.id);
      throw new InternalServerErrorException('Kayıt tamamlanamadı, tekrar deneyin.');
    }

    return { id: created.user.id, username };
  }
}

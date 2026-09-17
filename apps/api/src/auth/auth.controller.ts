import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SupabaseService } from '../supabase/supabase.service';
import { RegisterDto } from './register.dto';
import { ResetPasswordDto } from './reset-password.dto';
import { ChangeUsernameDto } from './change-username.dto';
import { usernameToEmail } from './username.util';
import { hashSecurityAnswer, verifySecurityAnswer } from './security-answer.util';
import { UserGuard } from './user.guard';
import type { AuthedRequest } from './user.guard';

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
    if ((dto.securityQuestion == null) !== (dto.securityAnswer == null)) {
      throw new BadRequestException('Güvenlik sorusu ve cevabı birlikte gönderilmeli.');
    }

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

    const { error: profileError } = await this.supabase.client.from('profiles').insert({
      id: created.user.id,
      username,
      security_question: dto.securityQuestion ?? null,
      security_answer_hash: dto.securityAnswer ? hashSecurityAnswer(dto.securityAnswer) : null,
    });
    if (profileError) {
      await this.supabase.client.auth.admin.deleteUser(created.user.id);
      throw new InternalServerErrorException('Kayıt tamamlanamadı, tekrar deneyin.');
    }

    return { id: created.user.id, username };
  }

  // Şifremi unuttum — adım 1: kullanıcı adına kayıtlı soruyu döner (varsa).
  @Get('security-question')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async getSecurityQuestion(@Query('username') username?: string) {
    if (!username) throw new BadRequestException('Kullanıcı adı gerekli.');
    const { data } = await this.supabase.client
      .from('profiles')
      .select('security_question')
      .eq('username', username.toLowerCase())
      .maybeSingle();

    if (!data?.security_question) {
      throw new NotFoundException('Bu kullanıcı adı için güvenlik sorusu tanımlı değil.');
    }
    return { question: data.security_question as string };
  }

  // Şifremi unuttum — adım 2: cevap doğrulanırsa şifre admin API ile değiştirilir.
  @Post('reset-password')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const { data: profile } = await this.supabase.client
      .from('profiles')
      .select('id, security_answer_hash')
      .eq('username', dto.username.toLowerCase())
      .maybeSingle();

    if (!profile?.security_answer_hash || !verifySecurityAnswer(dto.securityAnswer, profile.security_answer_hash)) {
      throw new UnauthorizedException('Kullanıcı adı veya güvenlik cevabı hatalı.');
    }

    const { error } = await this.supabase.client.auth.admin.updateUserById(profile.id, {
      password: dto.newPassword,
    });
    if (error) throw new InternalServerErrorException(error.message);
    return { ok: true };
  }

  // Kullanıcı adı değişimi: hem profiles.username hem de auth kaydının
  // e-postası (sentetik) ve user_metadata.username aynı anda güncellenir —
  // ikisi de senkron kalmalı (bkz. UsernameUtil.kt/username.util.ts).
  @Patch('username')
  @UseGuards(UserGuard)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async changeUsername(@Body() dto: ChangeUsernameDto, @Req() req: AuthedRequest) {
    const newUsername = dto.newUsername.toLowerCase();

    const { data: existing } = await this.supabase.client
      .from('profiles')
      .select('id')
      .eq('username', newUsername)
      .maybeSingle();
    if (existing && existing.id !== req.user.id) {
      throw new ConflictException('Bu kullanıcı adı zaten alınmış.');
    }

    const { error: authError } = await this.supabase.client.auth.admin.updateUserById(req.user.id, {
      email: usernameToEmail(newUsername),
      email_confirm: true,
      user_metadata: { username: newUsername },
    });
    if (authError) throw new InternalServerErrorException(authError.message);

    const { error: profileError } = await this.supabase.client
      .from('profiles')
      .update({ username: newUsername })
      .eq('id', req.user.id);
    if (profileError) throw new InternalServerErrorException(profileError.message);

    return { username: newUsername };
  }

  // Hesap silme: sonuçlar (results.user_id) anonimleştirilip korunur — kişisel
  // veri kalmaz, ama toplu istatistikler bozulmaz. auth.users silinince
  // profiles satırı zaten cascade ile gider (bkz. supabase/schema.sql).
  @Delete('me')
  @UseGuards(UserGuard)
  async deleteAccount(@Req() req: AuthedRequest) {
    await this.supabase.client.from('results').update({ user_id: null }).eq('user_id', req.user.id);

    const { error } = await this.supabase.client.auth.admin.deleteUser(req.user.id);
    if (error) throw new InternalServerErrorException(error.message);
    return { ok: true };
  }
}

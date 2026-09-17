import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { USERNAME_REGEX } from './username.util';

export class RegisterDto {
  @IsString()
  @Matches(USERNAME_REGEX, {
    message: 'Kullanıcı adı 3-20 karakter olmalı, sadece harf/rakam/._- içerebilir.',
  })
  username!: string;

  @IsString()
  @Length(8, 72)
  password!: string;

  // İkisi de opsiyonel ama birlikte gelmeli (bkz. auth.controller.ts) — bu
  // e-posta doğrulaması olmadan tek şifremi-unuttum mekanizması.
  @IsOptional()
  @IsString()
  @Length(4, 200)
  securityQuestion?: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  securityAnswer?: string;
}

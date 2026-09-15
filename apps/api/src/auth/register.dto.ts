import { IsString, Length, Matches } from 'class-validator';
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
}

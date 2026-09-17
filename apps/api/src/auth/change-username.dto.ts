import { IsString, Matches } from 'class-validator';
import { USERNAME_REGEX } from './username.util';

export class ChangeUsernameDto {
  @IsString()
  @Matches(USERNAME_REGEX, {
    message: 'Kullanıcı adı 3-20 karakter olmalı, sadece harf/rakam/._- içerebilir.',
  })
  newUsername!: string;
}

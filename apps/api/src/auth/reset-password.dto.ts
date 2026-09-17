import { IsString, Length, Matches } from 'class-validator';
import { USERNAME_REGEX } from './username.util';

export class ResetPasswordDto {
  @IsString()
  @Matches(USERNAME_REGEX)
  username!: string;

  @IsString()
  @Length(1, 200)
  securityAnswer!: string;

  @IsString()
  @Length(8, 72)
  newPassword!: string;
}

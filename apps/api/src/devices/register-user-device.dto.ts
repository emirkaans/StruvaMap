import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterUserDeviceDto {
  @IsString()
  @IsNotEmpty()
  fcmToken!: string;
}

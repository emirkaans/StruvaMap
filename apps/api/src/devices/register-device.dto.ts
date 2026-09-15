import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterDeviceDto {
  @IsString()
  @IsNotEmpty()
  resultId!: string;

  @IsString()
  @IsNotEmpty()
  fcmToken!: string;
}

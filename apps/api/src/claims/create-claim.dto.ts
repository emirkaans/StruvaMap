import { IsNotEmpty, IsString } from 'class-validator';

export class CreateClaimDto {
  @IsString()
  @IsNotEmpty()
  resultId!: string;

  // Sonucu çözen tarayıcının oturum kimliği (web lib/session.ts). Kodu
  // yalnızca sonucun sahibi alabilsin diye sonuç satırıyla eşleştirilir.
  @IsString()
  @IsNotEmpty()
  sessionId!: string;
}

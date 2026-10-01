import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AdminDataLookupDto {
  // Sonuç/kıyaslama bağlantısı ya da yalnızca kimlik.
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  q!: string;
}

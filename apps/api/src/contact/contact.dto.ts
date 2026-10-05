import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export const CONTACT_TOPICS = [
  'data_request', // kişisel veri talebi (silme, bilgi isteme...)
  'feedback',
  'bug',
  'other',
] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export class CreateContactMessageDto {
  @IsIn(CONTACT_TOPICS)
  topic!: ContactTopic;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  message!: string;

  // Yanıt istemiyorsa boş bırakılabilir; zorunlu değil.
  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  replyEmail?: string;

  // Veri talebinde sonuç ya da davet bağlantısı.
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reference?: string;

  // Bot tuzağı: formda görünmeyen alan. Dolu gelirse mesaj sessizce yok sayılır.
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}

export class AdminContactListDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;

  @IsOptional()
  @IsIn(['open', 'handled', 'all'])
  status?: 'open' | 'handled' | 'all';
}

export class SetHandledDto {
  @IsBoolean()
  handled!: boolean;
}

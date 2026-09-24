import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class PulseHistoryQueryDto {
  @IsString()
  @IsNotEmpty()
  pairId!: string;

  // Takvim ekranı 4 hafta gösteriyor (bkz. Android PulseHistoryScreen);
  // üst sınır sorgu boyutunu sınırlamak için.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(7)
  @Max(90)
  days?: number;
}

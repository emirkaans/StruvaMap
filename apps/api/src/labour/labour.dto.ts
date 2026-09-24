import { IsNotEmpty, IsString } from 'class-validator';

export class LogLabourDto {
  @IsString()
  @IsNotEmpty()
  pairId!: string;

  // LABOUR_CATEGORIES id'si (bkz. packages/shared/src/labour.ts) — servis doğrular.
  @IsString()
  @IsNotEmpty()
  category!: string;
}

export class LabourWeekQueryDto {
  @IsString()
  @IsNotEmpty()
  pairId!: string;
}

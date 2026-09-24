import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export const LABEL_MAX_LENGTH = 40;

export class CreateRelationshipDto {
  @IsString()
  @IsNotEmpty()
  testId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(LABEL_MAX_LENGTH)
  label!: string;
}

export class RenameRelationshipDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(LABEL_MAX_LENGTH)
  label!: string;
}

export class LinkPulseDto {
  // null → bağı kaldır.
  @IsOptional()
  @IsString()
  pairId?: string | null;
}

export class AssignResultDto {
  @IsString()
  @IsNotEmpty()
  resultId!: string;

  // null → sonucun ilişki bağını kaldır.
  @IsOptional()
  @IsString()
  relationshipId?: string | null;
}

import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

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

export const NOTE_MAX_LENGTH = 500;

export class AddNoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(NOTE_MAX_LENGTH)
  body!: string;
}

export class ArchiveDto {
  @IsBoolean()
  archived!: boolean;
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

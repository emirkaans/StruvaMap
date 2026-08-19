import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class SubmitResultDto {
  @IsString()
  @IsNotEmpty()
  testId!: string;

  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @IsObject()
  answers!: Record<number, number>;

  @IsObject()
  @IsOptional()
  contextAnswers?: Record<string, string>;
}

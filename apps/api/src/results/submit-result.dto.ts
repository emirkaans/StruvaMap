import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class SubmitResultDto {
  @IsString()
  @IsNotEmpty()
  testId!: string;

  // Anonim oturum kimliği (auth yok, client tarafında üretilip saklanır).
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  // questionId -> seçilen option index
  @IsObject()
  answers!: Record<number, number>;
}

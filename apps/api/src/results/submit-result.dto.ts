import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

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

  // contextQuestion.id -> seçilen option.value; puanlamaya girmez, sadece
  // yorum metni seçiminde kullanılır (bkz. computeScores).
  @IsObject()
  @IsOptional()
  contextAnswers?: Record<string, string>;
}

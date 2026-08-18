import { IsNotEmpty, IsString } from 'class-validator';

export class ListResultsDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @IsString()
  @IsNotEmpty()
  testId!: string;
}

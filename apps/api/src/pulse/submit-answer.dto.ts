import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class SubmitPulseAnswerDto {
  @IsString()
  @IsNotEmpty()
  checkinId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  answer!: number;
}

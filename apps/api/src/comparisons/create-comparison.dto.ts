import { IsNotEmpty, IsString } from 'class-validator';

export class CreateComparisonDto {
  @IsString()
  @IsNotEmpty()
  resultIdA!: string;

  @IsString()
  @IsNotEmpty()
  resultIdB!: string;
}

import { IsNotEmpty, IsString } from 'class-validator';

export class ListMyResultsDto {
  @IsString()
  @IsNotEmpty()
  testId!: string;
}

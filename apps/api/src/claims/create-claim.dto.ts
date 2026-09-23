import { IsNotEmpty, IsString } from 'class-validator';

export class CreateClaimDto {
  @IsString()
  @IsNotEmpty()
  resultId!: string;
}

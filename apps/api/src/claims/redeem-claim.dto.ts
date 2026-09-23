import { IsNotEmpty, IsString } from 'class-validator';

export class RedeemClaimDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}

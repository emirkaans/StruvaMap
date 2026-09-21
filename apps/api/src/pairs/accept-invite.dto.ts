import { IsNotEmpty, IsString } from 'class-validator';

export class AcceptInviteDto {
  @IsString()
  @IsNotEmpty()
  inviteCode!: string;
}

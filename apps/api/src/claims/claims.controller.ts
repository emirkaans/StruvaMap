import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserGuard } from '../auth/user.guard';
import type { AuthedRequest } from '../auth/user.guard';
import { ClaimsService } from './claims.service';
import { CreateClaimDto } from './create-claim.dto';
import { RedeemClaimDto } from './redeem-claim.dto';

@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  // Anonim/kimliksiz — web'in tıklama anında çağırdığı uç, sonuç sayfasını
  // görebilen herkes zaten sonucu görebiliyor (bkz. results.controller.ts
  // GET /results/:id de authsız), token üretmek ek bir yetki açmıyor.
  @Post()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  create(@Body() dto: CreateClaimDto) {
    return this.claimsService.create(dto.resultId);
  }

  @Post('redeem')
  @UseGuards(UserGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  redeem(@Body() dto: RedeemClaimDto, @Req() req: AuthedRequest) {
    return this.claimsService.redeem(req.user.id, dto.token);
  }
}

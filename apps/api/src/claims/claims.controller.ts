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

  // Kimliksiz: web'in tıklama anında çağırdığı uç. Sonuç id'si paylaşılan
  // linklerde göründüğü için tek başına yetki sayılmaz; kodu yalnızca sonucu
  // çözen tarayıcı (aynı sessionId) alabilir, bkz. claims.service.ts create().
  @Post()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  create(@Body() dto: CreateClaimDto) {
    return this.claimsService.create(dto.resultId, dto.sessionId);
  }

  @Post('redeem')
  @UseGuards(UserGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  redeem(@Body() dto: RedeemClaimDto, @Req() req: AuthedRequest) {
    return this.claimsService.redeem(req.user.id, dto.token);
  }
}

import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserGuard } from '../auth/user.guard';
import type { AuthedRequest } from '../auth/user.guard';
import { PairsService } from './pairs.service';
import { CreateInviteDto } from './create-invite.dto';
import { AcceptInviteDto } from './accept-invite.dto';

@Controller('pairs')
@UseGuards(UserGuard)
export class PairsController {
  constructor(private readonly pairsService: PairsService) {}

  @Post('invite')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  createInvite(@Body() dto: CreateInviteDto, @Req() req: AuthedRequest) {
    return this.pairsService.createInvite(req.user.id, dto.testId);
  }

  @Post('accept')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  accept(@Body() dto: AcceptInviteDto, @Req() req: AuthedRequest) {
    return this.pairsService.accept(req.user.id, dto.inviteCode);
  }

  // Davet eden taraf, karşı taraf kabul edene kadar bunu poll eder (aynı
  // desen: InviteViewModel.startPolling / comparisons/by-result).
  @Get('mine')
  findMine(@Req() req: AuthedRequest) {
    return this.pairsService.findMine(req.user.id);
  }

  @Delete(':id')
  end(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.pairsService.end(req.user.id, id);
  }
}

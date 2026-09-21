import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserGuard } from '../auth/user.guard';
import type { AuthedRequest } from '../auth/user.guard';
import { PulseService } from './pulse.service';
import { SubmitPulseAnswerDto } from './submit-answer.dto';

@Controller('pulse')
@UseGuards(UserGuard)
export class PulseController {
  constructor(private readonly pulseService: PulseService) {}

  @Get('today')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  getToday(@Query('pairId') pairId: string, @Req() req: AuthedRequest) {
    return this.pulseService.getToday(req.user.id, pairId);
  }

  @Post('answer')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  submitAnswer(@Body() dto: SubmitPulseAnswerDto, @Req() req: AuthedRequest) {
    return this.pulseService.submitAnswer(req.user.id, dto.checkinId, dto.answer);
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserGuard } from '../auth/user.guard';
import type { AuthedRequest } from '../auth/user.guard';
import { PredictionsService } from './predictions.service';
import { SavePredictionDto } from './save-prediction.dto';

// Yalnızca mobil (oturumlu) kullanıcı — tahmin, sonucun sahibine bağlı.
@Controller('predictions')
@UseGuards(UserGuard)
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  @Post()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  save(@Body() dto: SavePredictionDto, @Req() req: AuthedRequest) {
    return this.predictionsService.save(req.user.id, dto);
  }

  // Henüz tahmin yoksa 404 değil null (bkz. comparisons by-result deseni).
  @Get('by-result/:resultId')
  getMine(@Param('resultId') resultId: string, @Req() req: AuthedRequest) {
    return this.predictionsService.findMine(req.user.id, resultId);
  }
}

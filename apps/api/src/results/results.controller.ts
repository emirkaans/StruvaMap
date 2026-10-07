import { Body, Controller, Get, Headers, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserGuard } from '../auth/user.guard';
import type { AuthedRequest } from '../auth/user.guard';
import { ResultsService } from './results.service';
import { SubmitResultDto } from './submit-result.dto';
import { ListResultsDto } from './list-results.dto';
import { ListMyResultsDto } from './list-my-results.dto';
import { toPublicResult } from './public-result';

@Controller('results')
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Post()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  submit(@Body() dto: SubmitResultDto, @Headers('authorization') authorization?: string) {
    return this.resultsService.submit(dto, authorization);
  }

  @Get('mine')
  @UseGuards(UserGuard)
  listMine(@Query() query: ListMyResultsDto, @Req() req: AuthedRequest) {
    return this.resultsService.findByUser(req.user.id, query.testId);
  }

  @Get()
  list(@Query() query: ListResultsDto) {
    return this.resultsService
      .findBySession(query.sessionId, query.testId)
      .then((rows) => rows.map(toPublicResult));
  }

  // Anasayfadaki "bugüne kadar" sayısı; yalnızca toplam, kişisel veri yok.
  // ':id'den önce tanımlı olmalı, yoksa "stats" bir sonuç kimliği sanılır.
  @Get('stats/total')
  total() {
    return this.resultsService.countAll().then((total) => ({ total }));
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.resultsService.findById(id).then(toPublicResult);
  }
}

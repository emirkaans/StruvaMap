import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ResultsService } from './results.service';
import { SubmitResultDto } from './submit-result.dto';
import { ListResultsDto } from './list-results.dto';

@Controller('results')
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Post()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  submit(@Body() dto: SubmitResultDto) {
    return this.resultsService.submit(dto);
  }

  @Get()
  list(@Query() query: ListResultsDto) {
    return this.resultsService.findBySession(query.sessionId, query.testId);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.resultsService.findById(id);
  }
}

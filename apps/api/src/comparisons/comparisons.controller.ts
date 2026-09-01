import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ComparisonsService } from './comparisons.service';
import { CreateComparisonDto } from './create-comparison.dto';

@Controller('comparisons')
export class ComparisonsController {
  constructor(private readonly comparisonsService: ComparisonsService) {}

  @Post()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  create(@Body() dto: CreateComparisonDto) {
    return this.comparisonsService.create(dto);
  }

  @Get('by-result/:resultId')
  getByResult(@Param('resultId') resultId: string) {
    return this.comparisonsService.findByResultId(resultId);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.comparisonsService.findById(id);
  }
}

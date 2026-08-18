import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ComparisonsService } from './comparisons.service';
import { CreateComparisonDto } from './create-comparison.dto';

@Controller('comparisons')
export class ComparisonsController {
  constructor(private readonly comparisonsService: ComparisonsService) {}

  @Post()
  create(@Body() dto: CreateComparisonDto) {
    return this.comparisonsService.create(dto);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.comparisonsService.findById(id);
  }
}

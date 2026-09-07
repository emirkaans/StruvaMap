import { Controller, Get, Param, Query } from '@nestjs/common';
import { TestsService } from './tests.service';

@Controller('tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Get()
  async list(@Query('all') all?: string) {
    return this.testsService.listAll(all === 'true');
  }

  @Get(':testId')
  async getOne(@Param('testId') testId: string) {
    return this.testsService.getById(testId);
  }
}

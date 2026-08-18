import { Controller, Get, Param } from '@nestjs/common';
import { TestsService } from './tests.service';

@Controller('tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Get()
  list() {
    return this.testsService.listAll();
  }

  @Get(':testId')
  getOne(@Param('testId') testId: string) {
    return this.testsService.getById(testId);
  }
}

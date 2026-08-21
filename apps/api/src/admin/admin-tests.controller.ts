import { Body, Controller, Param, Put, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { TestsService } from '../tests/tests.service';
import { UpdateTestDto } from './update-test.dto';

/* Okuma için mevcut public GET /tests, GET /tests/:testId yeterli — içerik
   zaten herkese açık. Burada yalnızca yazma (admin-only) yaşıyor. */
@Controller('admin/tests')
@UseGuards(AdminGuard)
export class AdminTestsController {
  constructor(private readonly tests: TestsService) {}

  @Put(':testId')
  update(@Param('testId') testId: string, @Body() dto: UpdateTestDto) {
    return this.tests.update(testId, dto.definition);
  }
}

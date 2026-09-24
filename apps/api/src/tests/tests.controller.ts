import { Controller, Get, Param, Query } from '@nestjs/common';
import { getConversationPrompts } from '@struva/shared';
import { TestsService } from './tests.service';

@Controller('tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Get()
  async list(@Query('all') all?: string) {
    return this.testsService.listAll(all === 'true');
  }

  // Konuşma kartları (bkz. packages/shared/src/conversation-prompts.ts) —
  // test tanımına (DB, admin düzenler) değil koda bağlı; ayrı uç, admin'in
  // tanımı kaydederken bu alanı geri yazmaması için.
  @Get(':testId/conversation-prompts')
  conversationPrompts(@Param('testId') testId: string) {
    return getConversationPrompts(testId);
  }

  @Get(':testId')
  async getOne(@Param('testId') testId: string) {
    return this.testsService.getById(testId);
  }
}

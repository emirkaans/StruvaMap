import { Injectable, NotFoundException } from '@nestjs/common';
import { TEST_REGISTRY, TestDefinition } from '@struva/shared';

@Injectable()
export class TestsService {
  listAll(): TestDefinition[] {
    return Object.values(TEST_REGISTRY);
  }

  getById(testId: string): TestDefinition {
    const test = TEST_REGISTRY[testId];
    if (!test) throw new NotFoundException(`Test bulunamadı: ${testId}`);
    return test;
  }
}

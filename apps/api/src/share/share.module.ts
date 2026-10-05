import { Module } from '@nestjs/common';
import { ResultsModule } from '../results/results.module';
import { TestsModule } from '../tests/tests.module';
import { ShareController } from './share.controller';

@Module({
  imports: [ResultsModule, TestsModule],
  controllers: [ShareController],
})
export class ShareModule {}

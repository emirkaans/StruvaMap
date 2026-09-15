import { Module } from '@nestjs/common';
import { TestsModule } from '../tests/tests.module';
import { AuthModule } from '../auth/auth.module';
import { ResultsController } from './results.controller';
import { ResultsService } from './results.service';

@Module({
  imports: [TestsModule, AuthModule],
  controllers: [ResultsController],
  providers: [ResultsService],
  exports: [ResultsService],
})
export class ResultsModule {}

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ResultsModule } from '../results/results.module';
import { TestsModule } from '../tests/tests.module';
import { PredictionsController } from './predictions.controller';
import { PredictionsService } from './predictions.service';

@Module({
  imports: [AuthModule, ResultsModule, TestsModule],
  controllers: [PredictionsController],
  providers: [PredictionsService],
})
export class PredictionsModule {}

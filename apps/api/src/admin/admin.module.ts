import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../events/events.module';
import { ResultsModule } from '../results/results.module';
import { ComparisonsModule } from '../comparisons/comparisons.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [AuthModule, EventsModule, ResultsModule, ComparisonsModule],
  controllers: [AdminController],
})
export class AdminModule {}

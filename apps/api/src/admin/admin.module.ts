import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../events/events.module';
import { ResultsModule } from '../results/results.module';
import { ComparisonsModule } from '../comparisons/comparisons.module';
import { TestsModule } from '../tests/tests.module';
import { AdminController } from './admin.controller';
import { AdminTestsController } from './admin-tests.controller';
import { AdminMobileService } from './admin-mobile.service';
import { AdminDataService } from './admin-data.service';

@Module({
  imports: [AuthModule, EventsModule, ResultsModule, ComparisonsModule, TestsModule],
  controllers: [AdminController, AdminTestsController],
  providers: [AdminMobileService, AdminDataService],
})
export class AdminModule {}

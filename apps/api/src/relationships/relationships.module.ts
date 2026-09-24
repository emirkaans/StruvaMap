import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ResultsModule } from '../results/results.module';
import { TestsModule } from '../tests/tests.module';
import { PairsModule } from '../pairs/pairs.module';
import { PulseModule } from '../pulse/pulse.module';
import { LabourModule } from '../labour/labour.module';
import { RelationshipsController } from './relationships.controller';
import { RelationshipsService } from './relationships.service';

@Module({
  imports: [
    AuthModule,
    ResultsModule,
    TestsModule,
    PairsModule,
    PulseModule,
    LabourModule,
  ],
  controllers: [RelationshipsController],
  providers: [RelationshipsService],
})
export class RelationshipsModule {}

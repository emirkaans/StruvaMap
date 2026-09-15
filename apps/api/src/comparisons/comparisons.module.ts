import { Module } from '@nestjs/common';
import { ResultsModule } from '../results/results.module';
import { DevicesModule } from '../devices/devices.module';
import { PushModule } from '../push/push.module';
import { ComparisonsController } from './comparisons.controller';
import { ComparisonsService } from './comparisons.service';

@Module({
  imports: [ResultsModule, DevicesModule, PushModule],
  controllers: [ComparisonsController],
  providers: [ComparisonsService],
  exports: [ComparisonsService],
})
export class ComparisonsModule {}

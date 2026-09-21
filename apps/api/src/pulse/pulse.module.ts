import { Module } from '@nestjs/common';
import { PairsModule } from '../pairs/pairs.module';
import { DevicesModule } from '../devices/devices.module';
import { PushModule } from '../push/push.module';
import { PulseController } from './pulse.controller';
import { PulseService } from './pulse.service';
import { PulseCronService } from './pulse-cron.service';

@Module({
  imports: [PairsModule, DevicesModule, PushModule],
  controllers: [PulseController],
  providers: [PulseService, PulseCronService],
})
export class PulseModule {}

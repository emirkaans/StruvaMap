import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PairsModule } from '../pairs/pairs.module';
import { LabourController } from './labour.controller';
import { LabourService } from './labour.service';

@Module({
  imports: [AuthModule, PairsModule],
  controllers: [LabourController],
  providers: [LabourService],
  exports: [LabourService],
})
export class LabourModule {}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserGuard } from '../auth/user.guard';
import type { AuthedRequest } from '../auth/user.guard';
import { LabourService } from './labour.service';
import { LabourWeekQueryDto, LogLabourDto } from './labour.dto';

@Controller('labour')
@UseGuards(UserGuard)
export class LabourController {
  constructor(private readonly labour: LabourService) {}

  @Get('week')
  week(@Query() query: LabourWeekQueryDto, @Req() req: AuthedRequest) {
    return this.labour.week(req.user.id, query.pairId);
  }

  // Tek dokunuşla kayıt: arka arkaya birkaç iş girilebilsin diye genel
  // sınırdan (30/dk) biraz daha geniş.
  @Post()
  @Throttle({ default: { ttl: 60000, limit: 60 } })
  log(@Body() dto: LogLabourDto, @Req() req: AuthedRequest) {
    return this.labour.log(req.user.id, dto.pairId, dto.category);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.labour.remove(req.user.id, id);
  }
}

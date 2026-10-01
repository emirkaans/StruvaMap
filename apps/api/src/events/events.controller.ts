import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { platformFromUserAgent, TrackEventDto } from './track-event.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /* sendBeacon gövdeyi bekleme yapmadan yollar; 204 dönüp kapatıyoruz. */
  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  async track(
    @Body() dto: TrackEventDto,
    @Headers('user-agent') userAgent?: string,
  ): Promise<void> {
    await this.eventsService.track(dto, platformFromUserAgent(userAgent));
  }
}

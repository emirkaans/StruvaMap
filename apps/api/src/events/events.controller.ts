import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { EventsService } from './events.service';
import { TrackEventDto } from './track-event.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /* sendBeacon gövdeyi bekleme yapmadan yollar; 204 dönüp kapatıyoruz. */
  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  async track(@Body() dto: TrackEventDto): Promise<void> {
    await this.eventsService.track(dto);
  }
}

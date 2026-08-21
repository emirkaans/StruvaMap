import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { EventsService } from '../events/events.service';
import { EVENT_NAMES } from '../events/track-event.dto';
import { ResultsService } from '../results/results.service';
import { ComparisonsService } from '../comparisons/comparisons.service';
import { AdminListDto } from './admin-list.dto';
import { AdminEventsQueryDto, AdminEventsTrendDto } from './admin-events-query.dto';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly events: EventsService,
    private readonly results: ResultsService,
    private readonly comparisons: ComparisonsService,
  ) {}

  @Get('events/summary')
  eventsSummary(@Query() query: AdminEventsQueryDto) {
    return this.events.countByName(query.from, query.to);
  }

  @Get('events/trend')
  eventsTrend(@Query() query: AdminEventsTrendDto) {
    return this.events.dailyTrend(query.name, query.from, query.to);
  }

  @Get('events/funnel')
  eventsFunnel(@Query() query: AdminEventsQueryDto) {
    return this.events.funnel(EVENT_NAMES, query.from, query.to);
  }

  @Get('results')
  listResults(@Query() query: AdminListDto) {
    return this.results.findAllPaginated(query);
  }

  @Get('comparisons')
  listComparisons(@Query() query: AdminListDto) {
    return this.comparisons.findAllPaginated(query);
  }
}

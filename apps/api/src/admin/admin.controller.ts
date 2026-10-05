import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { EventsService } from '../events/events.service';
import { EVENT_NAMES } from '../events/track-event.dto';
import { ResultsService } from '../results/results.service';
import { ComparisonsService } from '../comparisons/comparisons.service';
import { AdminListDto } from './admin-list.dto';
import { AdminEventsQueryDto, AdminEventsTrendDto } from './admin-events-query.dto';
import { AdminMobileService } from './admin-mobile.service';
import { AdminDataService } from './admin-data.service';
import { AdminDataLookupDto } from './admin-data.dto';
import { AdminUsersService } from './admin-users.service';
import { AdminUsersQueryDto } from './admin-users.dto';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly events: EventsService,
    private readonly results: ResultsService,
    private readonly comparisons: ComparisonsService,
    private readonly mobile: AdminMobileService,
    private readonly data: AdminDataService,
    private readonly users: AdminUsersService,
  ) {}

  @Get('events/summary')
  eventsSummary(@Query() query: AdminEventsQueryDto) {
    return this.events.countByName(query);
  }

  @Get('events/trend')
  eventsTrend(@Query() query: AdminEventsTrendDto) {
    return this.events.dailyTrend(query);
  }

  @Get('events/funnel')
  eventsFunnel(@Query() query: AdminEventsQueryDto) {
    return this.events.funnel(EVENT_NAMES, query);
  }

  @Get('events/daily-total')
  eventsDailyTotal(@Query() query: AdminEventsQueryDto) {
    return this.events.dailyTrend(query);
  }

  @Get('results')
  listResults(@Query() query: AdminListDto) {
    return this.results.findAllPaginated(query);
  }

  @Get('results/by-test')
  resultsByTest() {
    return this.results.countByTest();
  }

  @Get('results/daily-total')
  resultsDailyTotal(@Query() query: AdminEventsQueryDto) {
    return this.results.dailyTotalTrend(query.from, query.to);
  }

  @Get('comparisons')
  listComparisons(@Query() query: AdminListDto) {
    return this.comparisons.findAllPaginated(query);
  }

  @Get('mobile')
  mobileSummary(@Query() query: AdminEventsQueryDto) {
    return this.mobile.summary(query.from, query.to);
  }

  @Get('users')
  listUsers(@Query() query: AdminUsersQueryDto) {
    return this.users.list(query);
  }

  @Get('users/:id')
  userDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.detail(id);
  }

  @Get('data/lookup')
  lookupData(@Query() query: AdminDataLookupDto) {
    return this.data.lookup(query.q);
  }

  @Delete('data/sessions/:sessionId')
  deleteSessionData(@Param('sessionId') sessionId: string) {
    return this.data.deleteSession(sessionId);
  }

  @Get('comparisons/daily-total')
  comparisonsDailyTotal(@Query() query: AdminEventsQueryDto) {
    return this.comparisons.dailyTotalTrend(query.from, query.to);
  }
}

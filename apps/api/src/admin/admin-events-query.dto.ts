import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';
import { EVENT_NAMES } from '../events/track-event.dto';

export class AdminEventsQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

export class AdminEventsTrendDto extends AdminEventsQueryDto {
  @IsString()
  @IsIn(EVENT_NAMES)
  name!: (typeof EVENT_NAMES)[number];
}

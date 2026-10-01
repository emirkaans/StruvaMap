import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';
import { EVENT_NAMES, PLATFORMS } from '../events/track-event.dto';
import type { Platform } from '../events/track-event.dto';

export class AdminEventsQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  // Verilmezse tüm platformlar (platform bilgisi olmayan eski olaylar dahil).
  @IsOptional()
  @IsIn(PLATFORMS)
  platform?: Platform;
}

export class AdminEventsTrendDto extends AdminEventsQueryDto {
  @IsString()
  @IsIn(EVENT_NAMES)
  name!: (typeof EVENT_NAMES)[number];
}

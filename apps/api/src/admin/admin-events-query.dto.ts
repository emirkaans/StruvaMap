import { IsISO8601, IsIn, IsOptional, IsString } from 'class-validator';
import { EVENT_NAMES, PLATFORMS } from '../events/track-event.dto';
import type { Platform } from '../events/track-event.dto';

export class AdminEventsQueryDto {
  @IsOptional()
  // strict: 31 Nisan gibi takvimde olmayan günler de reddedilir (yoksa
  // Postgres'e ulaşıp 500 veriyordu).
  @IsISO8601({ strict: true })
  from?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
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

import {
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export const EVENT_NAMES = [
  'landing_view',
  'test_start',
  'test_progress',
  'test_complete',
  'result_view',
  'comparison_view',
  'comparison_ready',
  'invite_copied',
  'link_copied',
  'share_image_download',
  'print_pdf',
  'playstore_click',
  // Android: nabız cevabı; props.source = app | notification | widget —
  // hızlı cevap yüzeylerinin cevap oranına etkisini ölçmek için.
  'pulse_answer',
  // Android: kıyaslama öncesi karşı taraf için tahmin kaydedildi.
  'prediction_saved',
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

export class TrackEventDto {
  @IsString()
  @IsIn(EVENT_NAMES)
  name!: EventName;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  sessionId!: string;

  @IsString()
  @IsOptional()
  @MaxLength(64)
  testId?: string;

  @IsObject()
  @IsOptional()
  props?: Record<string, string | number | boolean>;
}

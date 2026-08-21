import { IsObject } from 'class-validator';

export class UpdateTestDto {
  @IsObject()
  definition!: Record<string, unknown>;
}

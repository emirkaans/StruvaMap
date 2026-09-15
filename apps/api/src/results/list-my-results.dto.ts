import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ListMyResultsDto {
  // Verilmezse: kullanıcının çözdüğü tüm testlerin sonuçları (mobil "Geçmiş"
  // sekmesi için, bkz. results.service.ts findByUser).
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  testId?: string;
}

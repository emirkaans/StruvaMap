import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class SavePredictionDto {
  @IsString()
  @IsNotEmpty()
  resultId!: string;

  // { [boyutId]: 0-100 } — anahtarların testin boyutlarıyla birebir
  // eşleşmesi ve değer aralığı servis tarafında doğrulanıyor (test tanımı
  // DB'den geldiği için DTO seviyesinde bilinmiyor).
  @IsObject()
  dimensions!: Record<string, number>;
}

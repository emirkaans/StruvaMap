import type { ResultRow } from './results.service';

export type PublicResultRow = Omit<ResultRow, 'session_id' | 'user_id'>;

// Herkese açık uçlarda (sonuç linki, kıyaslama sayfası) dönen sonuç satırı.
// Sonuç id'si paylaşılan linklerde açıkça durduğu için session_id ve user_id
// dışarı verilmez: session_id, claims.service.ts'te sonucun sahibi olduğunu
// kanıtlamak için kullanılıyor, sızarsa o kanıt anlamını yitirir.
export function toPublicResult(row: ResultRow): PublicResultRow {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { session_id, user_id, ...rest } = row;
  return rest;
}

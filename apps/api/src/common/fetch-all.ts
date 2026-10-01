import { InternalServerErrorException } from '@nestjs/common';

export const FETCH_PAGE_SIZE = 1000;

type PageResult<T> = PromiseLike<{
  data: T[] | null;
  error: { message: string } | null;
}>;

/* Supabase tek istekte en fazla 1000 satır döner; fazlası sessizce kesilir.
   Sayım ya da gruplama için tüm satırlar gerektiğinde sayfa sayfa çeker.
   `page` aynı sorguyu verilen aralıkla (.range) kurmalı ve sabit bir sıralama
   içermeli, yoksa sayfalar arasında satır kayar ya da tekrar eder. */
export async function fetchAll<T>(
  page: (from: number, to: number) => PageResult<T>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += FETCH_PAGE_SIZE) {
    const { data, error } = await page(offset, offset + FETCH_PAGE_SIZE - 1);
    if (error) throw new InternalServerErrorException(error.message);
    const chunk = data ?? [];
    rows.push(...chunk);
    if (chunk.length < FETCH_PAGE_SIZE) return rows;
  }
}

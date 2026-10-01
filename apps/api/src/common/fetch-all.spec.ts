import { FETCH_PAGE_SIZE, fetchAll } from './fetch-all';

describe('fetchAll', () => {
  it('1000 satırı aşan sonucu sayfa sayfa birleştirir', async () => {
    const total = FETCH_PAGE_SIZE * 2 + 5;
    const all = Array.from({ length: total }, (_, i) => i);
    const ranges: Array<[number, number]> = [];
    const rows = await fetchAll((from, to) => {
      ranges.push([from, to]);
      return Promise.resolve({ data: all.slice(from, to + 1), error: null });
    });
    expect(rows).toEqual(all);
    expect(ranges).toHaveLength(3);
  });

  it('tam sayfa sınırında boş son sayfayla biter', async () => {
    const all = Array.from({ length: FETCH_PAGE_SIZE }, (_, i) => i);
    const rows = await fetchAll((from, to) =>
      Promise.resolve({ data: all.slice(from, to + 1), error: null }),
    );
    expect(rows).toHaveLength(FETCH_PAGE_SIZE);
  });

  it('hata dönerse fırlatır', async () => {
    await expect(
      fetchAll(() =>
        Promise.resolve({ data: null, error: { message: 'boom' } }),
      ),
    ).rejects.toThrow('boom');
  });
});

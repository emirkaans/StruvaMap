import { extractId } from './admin-data.service';

describe('extractId', () => {
  const id = '3f2a1b4c-5d6e-4f70-8a9b-0c1d2e3f4a5b';

  it('çıplak kimliği alır', () => {
    expect(extractId(id)).toBe(id);
  });

  it('sonuç ve davet bağlantılarından kimliği çıkarır', () => {
    expect(extractId(`https://struvamap.com/result/${id}`)).toBe(id);
    expect(
      extractId(
        `https://struvamap.com/test/romantic?compareWith=${id.toUpperCase()}`,
      ),
    ).toBe(id);
  });

  it('kimlik yoksa null döner', () => {
    expect(extractId('https://struvamap.com/test/romantic')).toBeNull();
  });
});

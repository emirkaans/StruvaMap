import { describe, expect, it } from 'vitest';
import { toTurkishUpper } from './text';

describe('toTurkishUpper', () => {
  it('noktalı i harfini noktalı büyük İ yapar', () => {
    expect(toTurkishUpper('ilişki')).toBe('İLİŞKİ');
  });

  it('noktasız ı harfini noktasız büyük I yapar', () => {
    expect(toTurkishUpper('ışık')).toBe('IŞIK');
  });

  it('ingilizce büyük harfe çevirmenin bozduğu karışık metni doğru çevirir', () => {
    expect(toTurkishUpper('Istanbul')).toBe('ISTANBUL');
    expect(toTurkishUpper('izmir')).toBe('İZMİR');
  });

  it('harf içermeyen karakterleri değiştirmez', () => {
    expect(toTurkishUpper('123-abc!')).toBe('123-ABC!');
  });
});

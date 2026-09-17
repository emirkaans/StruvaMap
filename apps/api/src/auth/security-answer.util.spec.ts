import { hashSecurityAnswer, verifySecurityAnswer } from './security-answer.util';

describe('security-answer.util', () => {
  it('doğru cevabı doğrular', () => {
    const stored = hashSecurityAnswer('Kırmızı Bisiklet');
    expect(verifySecurityAnswer('Kırmızı Bisiklet', stored)).toBe(true);
  });

  it('büyük/küçük harf ve baştaki/sondaki boşluğu görmezden gelir', () => {
    const stored = hashSecurityAnswer('Kırmızı Bisiklet');
    expect(verifySecurityAnswer('  kırmızı bisiklet  ', stored)).toBe(true);
  });

  it('yanlış cevabı reddeder', () => {
    const stored = hashSecurityAnswer('Kırmızı Bisiklet');
    expect(verifySecurityAnswer('Mavi Araba', stored)).toBe(false);
  });

  it('bozuk/eksik hash karşısında false döner, fırlatmaz', () => {
    expect(verifySecurityAnswer('cevap', 'bozuk-deger')).toBe(false);
  });

  it('aynı cevap için her seferinde farklı hash üretir (rastgele salt)', () => {
    const a = hashSecurityAnswer('aynı cevap');
    const b = hashSecurityAnswer('aynı cevap');
    expect(a).not.toEqual(b);
    expect(verifySecurityAnswer('aynı cevap', a)).toBe(true);
    expect(verifySecurityAnswer('aynı cevap', b)).toBe(true);
  });
});

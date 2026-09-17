import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

// E-posta doğrulaması istemiyoruz; şifremi unuttum akışı bunun yerine
// kayıtta opsiyonel toplanan bir güvenlik sorusu/cevabına dayanıyor.
// Cevap düz metin saklanmaz — scrypt + rastgele salt.
function normalize(answer: string): string {
  return answer.trim().toLowerCase();
}

export function hashSecurityAnswer(answer: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(normalize(answer), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifySecurityAnswer(answer: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = scryptSync(normalize(answer), salt, 64);
  const expected = Buffer.from(hash, 'hex');
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

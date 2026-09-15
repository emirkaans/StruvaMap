export const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,20}$/;

// Supabase Auth e-posta zorunlu kılar; kullanıcı adı+şifre akışı için
// gerçek e-posta yerine bu sabit alan adıyla sentetik bir e-posta üretilir.
// Gerçek kullanıcı adı profiles.username'de tutulur.
const SYNTHETIC_EMAIL_DOMAIN = 'users.struvamap.internal';

export function usernameToEmail(username: string): string {
  return `${username.toLowerCase()}@${SYNTHETIC_EMAIL_DOMAIN}`;
}

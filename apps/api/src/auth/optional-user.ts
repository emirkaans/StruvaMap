import { SupabaseClient, User } from '@supabase/supabase-js';

// UserGuard'ın throw etmeyen hali: web'in anonim akışını bozmadan, varsa
// Authorization header'ından kullanıcıyı çözer. Token yoksa/geçersizse null
// döner — çağıran taraf anonim akışa devam eder.
export async function getOptionalUser(
  supabase: SupabaseClient,
  authorizationHeader: string | undefined,
): Promise<User | null> {
  const token = authorizationHeader?.startsWith('Bearer ') ? authorizationHeader.slice(7) : undefined;
  if (!token) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

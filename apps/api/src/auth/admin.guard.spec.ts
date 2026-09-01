import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminGuard, AdminRequest } from './admin.guard';
import { SupabaseService } from '../supabase/supabase.service';

function makeContext(
  headers: Record<string, string | undefined>,
): ExecutionContext {
  const request = { headers } as AdminRequest;
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

function makeConfig(adminEmails: string): ConfigService {
  return {
    getOrThrow: jest.fn().mockReturnValue(adminEmails),
  } as unknown as ConfigService;
}

function makeSupabase(getUserResult: {
  data: { user: unknown };
  error: unknown;
}): SupabaseService {
  return {
    client: {
      auth: { getUser: jest.fn().mockResolvedValue(getUserResult) },
    },
  } as unknown as SupabaseService;
}

describe('AdminGuard', () => {
  it('Authorization başlığı yoksa reddeder', async () => {
    const guard = new AdminGuard(
      makeSupabase({ data: { user: null }, error: null }),
      makeConfig('a@x.com'),
    );
    await expect(guard.canActivate(makeContext({}))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('Bearer olmayan başlığı reddeder', async () => {
    const guard = new AdminGuard(
      makeSupabase({ data: { user: null }, error: null }),
      makeConfig('a@x.com'),
    );
    await expect(
      guard.canActivate(makeContext({ authorization: 'Token xyz' })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('Supabase geçersiz token dönerse reddeder', async () => {
    const guard = new AdminGuard(
      makeSupabase({ data: { user: null }, error: { message: 'invalid' } }),
      makeConfig('a@x.com'),
    );
    await expect(
      guard.canActivate(makeContext({ authorization: 'Bearer bad-token' })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('geçerli oturum ama email allowlist dışındaysa reddeder', async () => {
    const guard = new AdminGuard(
      makeSupabase({
        data: { user: { email: 'outsider@x.com' } },
        error: null,
      }),
      makeConfig('a@x.com,b@y.com'),
    );
    await expect(
      guard.canActivate(makeContext({ authorization: 'Bearer good-token' })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('email allowlist büyük/küçük harf duyarsız eşleşirse izin verir', async () => {
    const user = { email: 'Admin@X.com' };
    const supabase = makeSupabase({ data: { user }, error: null });
    const guard = new AdminGuard(supabase, makeConfig('admin@x.com'));
    const context = makeContext({ authorization: 'Bearer good-token' });

    await expect(guard.canActivate(context)).resolves.toBe(true);

    const request = context.switchToHttp().getRequest<AdminRequest>();
    expect(request.adminUser).toBe(user);
  });

  it('allowlist string baştaki/sondaki boşlukları temizler', async () => {
    const user = { email: 'a@x.com' };
    const supabase = makeSupabase({ data: { user }, error: null });
    const guard = new AdminGuard(supabase, makeConfig(' a@x.com , b@y.com '));
    await expect(
      guard.canActivate(makeContext({ authorization: 'Bearer t' })),
    ).resolves.toBe(true);
  });
});

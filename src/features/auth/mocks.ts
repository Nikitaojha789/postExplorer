import { registerMockRoute } from '@/core/api/mock';

/** Dev-only mock backend for this feature. Registered from app/bootstrap/mocks.ts. */
export const registerAuthMocks = (): void => {
  registerMockRoute('POST', '/auth/sign-in', ({ body }) => {
    const { email, password } = body as { email: string; password: string };
    if (password !== 'password') {
      return { status: 401, body: { message: 'Invalid credentials' } };
    }
    return {
      body: {
        tokens: { accessToken: `access-${Date.now()}`, refreshToken: `refresh-${Date.now()}` },
        user: { id: 'user-1', name: email.split('@')[0] ?? 'User', email },
      },
    };
  });

  registerMockRoute('POST', '/auth/refresh', () => ({
    body: { accessToken: `access-${Date.now()}`, refreshToken: `refresh-${Date.now()}` },
  }));
};

import { AppError } from '@/core/errors';

import { authApi } from './authApi';

describe('authApi.signIn', () => {
  it('returns tokens and session user for valid credentials', async () => {
    const result = await authApi.signIn({
      email: 'user@example.com',
      password: 'password',
    });

    expect(result.user).toEqual({
      id: 'user-1',
      name: 'user',
      email: 'user@example.com',
    });
    expect(result.tokens.accessToken).toMatch(/^access-/);
    expect(result.tokens.refreshToken).toMatch(/^refresh-/);
  });

  it('throws unauthorized AppError when password is not "password"', async () => {
    let thrownError: unknown;
    try {
      await authApi.signIn({
        email: 'user@example.com',
        password: 'wrongpassword',
      });
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeInstanceOf(AppError);
    const appError = thrownError as AppError;
    expect(appError.kind).toBe('unauthorized');
    expect(appError.status).toBe(401);
  });
});

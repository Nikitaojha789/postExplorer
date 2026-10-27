import { z } from 'zod';

import { SessionUserSchema, TokenPairSchema } from '@/core/auth';
import { AppError } from '@/core/errors';

export const SignInResponseSchema = z.object({
  tokens: TokenPairSchema,
  user: SessionUserSchema,
});
export type SignInResponse = z.infer<typeof SignInResponseSchema>;

export interface SignInRequest {
  email: string;
  password: string;
}

export const authApi = {
  signIn: (body: SignInRequest): Promise<SignInResponse> => {
    // Demo authentication: accept any email with password "password"
    if (body.password !== 'password') {
      return Promise.reject(
        new AppError({
          kind: 'unauthorized',
          message: 'Invalid credentials',
          status: 401,
        }),
      );
    }

    return Promise.resolve({
      tokens: {
        accessToken: `access-${Date.now()}`,
        refreshToken: `refresh-${Date.now()}`,
      },
      user: {
        id: 'user-1',
        name: body.email.split('@')[0] ?? 'User',
        email: body.email,
      },
    });
  },
} as const;

import { z } from 'zod';

import { http } from '@/core/api';
import { SessionUserSchema, TokenPairSchema } from '@/core/auth';

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
  signIn: (body: SignInRequest) =>
    http.post('/auth/sign-in', { body, schema: SignInResponseSchema, auth: false }),
} as const;

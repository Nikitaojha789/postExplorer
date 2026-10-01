import { z } from 'zod';

export const SessionUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
});
export type SessionUser = z.infer<typeof SessionUserSchema>;

export const TokenPairSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});
export type TokenPair = z.infer<typeof TokenPairSchema>;

export type SessionStatus = 'restoring' | 'signedOut' | 'signedIn';

export type SignOutReason = 'user' | 'expired';

import { SecureKeys, secureStorage } from '@/core/storage';

import type { TokenPair } from './types';

/** In-memory only; re-obtained via refresh after a cold start. */
let accessToken: string | null = null;

export const tokens = {
  getAccessToken: (): string | null => accessToken,

  getRefreshToken: (): Promise<string | null> => secureStorage.get(SecureKeys.refreshToken),

  async save(pair: TokenPair): Promise<void> {
    accessToken = pair.accessToken;
    await secureStorage.set(SecureKeys.refreshToken, pair.refreshToken);
  },

  /** Swaps the in-memory access token for an invalid one (dev tooling only; no-op in release). */
  expireAccessTokenForTesting(): void {
    if (__DEV__ && accessToken) accessToken = 'expired-for-testing';
  },

  async clear(): Promise<void> {
    accessToken = null;
    await secureStorage.remove(SecureKeys.refreshToken);
  },
} as const;

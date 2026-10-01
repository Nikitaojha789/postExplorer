import { analytics } from '@/core/analytics';
import { http, queryClient, type AuthHandlers } from '@/core/api';
import { isAppError } from '@/core/errors';
import { logger } from '@/core/logger';
import { setMonitoringUser } from '@/core/monitoring';
import { StorageKeys, userStorage } from '@/core/storage';

import { useSessionStore } from './sessionStore';
import { tokens } from './tokens';
import {
  SessionUserSchema,
  TokenPairSchema,
  type SessionUser,
  type SignOutReason,
  type TokenPair,
} from './types';

const REFRESH_PATH = '/auth/refresh';

/** Called once at bootstrap: decides signedIn/signedOut before first paint. */
export const restoreSession = async (): Promise<void> => {
  const [refreshToken, user] = await Promise.all([
    tokens.getRefreshToken(),
    Promise.resolve(userStorage.getObject(StorageKeys.sessionUser, SessionUserSchema)),
  ]);

  if (refreshToken && user) {
    // Access token is fetched lazily: the first API call 401s and refreshes.
    useSessionStore.setState({ status: 'signedIn', user });
    setMonitoringUser(user.id);
    return;
  }
  useSessionStore.setState({ status: 'signedOut', user: null });
};

export const startSession = async (pair: TokenPair, user: SessionUser): Promise<void> => {
  await tokens.save(pair);
  userStorage.setObject(StorageKeys.sessionUser, user);
  setMonitoringUser(user.id);
  analytics.identify(user.id);
  useSessionStore.setState({ status: 'signedIn', user });
};

export const endSession = async (reason: SignOutReason = 'user'): Promise<void> => {
  if (useSessionStore.getState().status === 'signedOut') return;
  logger.info('Ending session', { reason });

  // Flip state first so the navigator swaps to the signed-out stack and
  // in-flight screens unmount before their data disappears.
  useSessionStore.setState({ status: 'signedOut', user: null });
  queryClient.clear();
  userStorage.clearAll();
  setMonitoringUser(null);
  analytics.reset();
  await tokens.clear();
};

/**
 * Refresh contract: resolves the new access token, resolves `null` when the
 * server definitively rejects the refresh token (→ sign out), and THROWS on
 * transient failures (offline, 5xx) so a flaky network never logs users out.
 */
const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = await tokens.getRefreshToken();
  if (!refreshToken) return null;
  try {
    const pair = await http.post(REFRESH_PATH, {
      body: { refreshToken },
      schema: TokenPairSchema,
      auth: false,
    });
    await tokens.save(pair);
    return pair.accessToken;
  } catch (error) {
    if (
      isAppError(error) &&
      (error.kind === 'unauthorized' || error.kind === 'validation' || error.kind === 'forbidden')
    ) {
      return null;
    }
    throw error;
  }
};

export const authHttpHandlers: AuthHandlers = {
  getAccessToken: tokens.getAccessToken,
  refreshAccessToken,
  onSessionExpired: () => {
    void endSession('expired');
  },
};

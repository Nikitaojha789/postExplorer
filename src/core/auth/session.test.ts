import { queryClient } from '@/core/api';
import { SecureKeys, secureStorage, StorageKeys, userStorage } from '@/core/storage';

import { endSession, onSessionEnded, restoreSession, startSession } from './session';
import { useSessionStore } from './sessionStore';
import { tokens } from './tokens';

const user = { id: 'u1', name: 'Ada', email: 'ada@example.com' };
const pair = { accessToken: 'access-1', refreshToken: 'refresh-1' };

beforeEach(async () => {
  useSessionStore.setState({ status: 'restoring', user: null });
  userStorage.clearAll();
  await secureStorage.remove(SecureKeys.refreshToken);
});

describe('session lifecycle', () => {
  it('restores as signed-out when nothing is stored', async () => {
    await restoreSession();
    expect(useSessionStore.getState()).toEqual({ status: 'signedOut', user: null });
  });

  it('keeps the refresh token in secure storage and the access token in memory only', async () => {
    await startSession(pair, user);

    expect(useSessionStore.getState()).toEqual({ status: 'signedIn', user });
    expect(tokens.getAccessToken()).toBe('access-1');
    expect(await secureStorage.get(SecureKeys.refreshToken)).toBe('refresh-1');
    // Nothing token-shaped is written to the (unencrypted) KV store.
    expect(JSON.stringify(userStorage.getString(StorageKeys.sessionUser))).not.toContain('refresh');
  });

  it('restores a previous session after a cold start', async () => {
    await startSession(pair, user);
    useSessionStore.setState({ status: 'restoring', user: null });

    await restoreSession();
    expect(useSessionStore.getState()).toEqual({ status: 'signedIn', user });
  });

  it('wipes tokens, user data and the query cache on sign-out', async () => {
    await startSession(pair, user);
    queryClient.setQueryData(['private'], { secret: true });

    await endSession('user');

    expect(useSessionStore.getState().status).toBe('signedOut');
    expect(tokens.getAccessToken()).toBeNull();
    expect(await secureStorage.get(SecureKeys.refreshToken)).toBeNull();
    expect(userStorage.getString(StorageKeys.sessionUser)).toBeUndefined();
    expect(queryClient.getQueryData(['private'])).toBeUndefined();
  });

  it('notifies session-ended listeners, even when one of them throws', async () => {
    const first = jest.fn(() => {
      throw new Error('store reset failed');
    });
    const second = jest.fn();
    const unsubscribeFirst = onSessionEnded(first);
    const unsubscribeSecond = onSessionEnded(second);
    await startSession(pair, user);

    await endSession('expired');

    expect(first).toHaveBeenCalledWith('expired');
    expect(second).toHaveBeenCalledWith('expired');
    expect(useSessionStore.getState().status).toBe('signedOut');
    expect(await secureStorage.get(SecureKeys.refreshToken)).toBeNull();

    unsubscribeFirst();
    unsubscribeSecond();
    await startSession(pair, user);
    await endSession('user');
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('leaves user storage empty even if a listener persists a reset state', async () => {
    const unsubscribe = onSessionEnded(() => userStorage.setString(StorageKeys.sessionUser, '{}'));
    await startSession(pair, user);

    await endSession('user');

    expect(userStorage.getString(StorageKeys.sessionUser)).toBeUndefined();
    unsubscribe();
  });
});

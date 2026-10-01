import { create } from 'zustand';

import type { SessionStatus, SessionUser } from './types';

interface SessionState {
  status: SessionStatus;
  user: SessionUser | null;
}

/**
 * Observable session state. Holds NO tokens: the access token lives in a
 * module variable (tokens.ts) and the refresh token in the Keychain, so
 * neither can leak through devtools, persistence or re-render props.
 */
export const useSessionStore = create<SessionState>()(() => ({
  status: 'restoring',
  user: null,
}));

export const useSessionStatus = () => useSessionStore(state => state.status);
export const useSessionUser = () => useSessionStore(state => state.user);
/** Navigation `if:` guards (static config). */
export const useIsSignedIn = () => useSessionStore(state => state.status === 'signedIn');
export const useIsSignedOut = () => useSessionStore(state => state.status === 'signedOut');

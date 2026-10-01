import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { focusManager } from '@tanstack/react-query';

/** App foreground/background → TanStack `focusManager` (refetch stale on resume). */
export const bindAppStateToQueries = (): void => {
  focusManager.setEventListener(setFocused => {
    const subscription = AppState.addEventListener('change', status => {
      setFocused(status === 'active');
    });
    return () => subscription.remove();
  });
};

const STATUSES: readonly string[] = ['active', 'background', 'inactive', 'unknown', 'extension'];
const currentStatus = (): AppStateStatus => {
  const value = AppState.currentState;
  return typeof value === 'string' && STATUSES.includes(value)
    ? (value as AppStateStatus)
    : 'active';
};

export const useAppState = (): AppStateStatus => {
  const [state, setState] = useState(currentStatus);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', setState);
    return () => subscription.remove();
  }, []);
  return state;
};

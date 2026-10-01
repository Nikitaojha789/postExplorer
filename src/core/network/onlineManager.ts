import { useSyncExternalStore } from 'react';

import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';

/**
 * Single source of truth for connectivity: NetInfo → TanStack `onlineManager`.
 * Queries pause while offline and resume on reconnect; UI reads the same
 * state via `useIsOnline()`. `isInternetReachable === null` means "unknown"
 * and is treated as online to avoid false offline banners at startup.
 */
export const bindNetworkStatus = (): void => {
  onlineManager.setEventListener(setOnline =>
    NetInfo.addEventListener(state => {
      setOnline(state.isConnected !== false && state.isInternetReachable !== false);
    }),
  );
};

const subscribe = (onChange: () => void) => onlineManager.subscribe(onChange);
const getSnapshot = () => onlineManager.isOnline();

export const useIsOnline = (): boolean => useSyncExternalStore(subscribe, getSnapshot);

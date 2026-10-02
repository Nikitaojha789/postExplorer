import { useSyncExternalStore } from 'react';

import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';

/** Last reachability reported by NetInfo (unknown → online). */
let deviceOnline = true;
/** Dev tooling: behave as offline while the device is online. */
let simulatedOffline = false;

/**
 * Single source of truth for connectivity: NetInfo → TanStack `onlineManager`.
 * Queries pause while offline and resume on reconnect; UI reads the same
 * state via `useIsOnline()`. `isInternetReachable === null` means "unknown"
 * and is treated as online to avoid false offline banners at startup.
 */
export const bindNetworkStatus = (): void => {
  onlineManager.setEventListener(setOnline =>
    NetInfo.addEventListener(state => {
      deviceOnline = state.isConnected !== false && state.isInternetReachable !== false;
      setOnline(deviceOnline && !simulatedOffline);
    }),
  );
};

/**
 * Dev tooling: forces the app offline (paused queries and mutations, offline
 * banner, failing requests — see `core/api` network conditions) without
 * touching the device's network, which simulators can't easily drop.
 */
export const setSimulatedOffline = (value: boolean): void => {
  simulatedOffline = value;
  onlineManager.setOnline(deviceOnline && !simulatedOffline);
};

export const isSimulatedOffline = (): boolean => simulatedOffline;

const subscribe = (onChange: () => void) => onlineManager.subscribe(onChange);
const getSnapshot = () => onlineManager.isOnline();

export const useIsOnline = (): boolean => useSyncExternalStore(subscribe, getSnapshot);

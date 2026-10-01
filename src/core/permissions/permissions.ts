import { useCallback, useEffect, useState } from 'react';

import {
  check,
  openSettings,
  PERMISSIONS,
  request,
  requestNotifications,
  RESULTS,
  type Permission,
  type PermissionStatus,
} from 'react-native-permissions';

import { useAppState } from '@/core/lifecycle';

/**
 * Permission flow: check → (denied) request → (blocked) send to Settings.
 *
 * Rules: request just-in-time, right before the feature needs it, after the
 * UI has explained why. Never request at startup. On iOS each permission must
 * also be enabled in the Podfile `setup_permissions([...])` and have an
 * Info.plist usage string; on Android, declared in AndroidManifest.xml.
 */
export const ensurePermission = async (permission: Permission): Promise<PermissionStatus> => {
  const status = await check(permission);
  return status === RESULTS.DENIED ? request(permission) : status;
};

export const ensureNotificationPermission = async (): Promise<PermissionStatus> =>
  (await requestNotifications(['alert', 'badge', 'sound'])).status;

export const isUsable = (status: PermissionStatus): boolean =>
  status === RESULTS.GRANTED || status === RESULTS.LIMITED;

/**
 * Tracks a permission and re-checks when the app returns to the foreground
 * (the user may have changed it in Settings).
 */
export const usePermission = (permission: Permission) => {
  const [status, setStatus] = useState<PermissionStatus | null>(null);
  const appState = useAppState();

  useEffect(() => {
    if (appState !== 'active') return;
    let cancelled = false;
    void check(permission).then(next => {
      if (!cancelled) setStatus(next);
    });
    return () => {
      cancelled = true;
    };
  }, [permission, appState]);

  const requestPermission = useCallback(async () => {
    const next = await ensurePermission(permission);
    setStatus(next);
    return next;
  }, [permission]);

  return { status, request: requestPermission, openSettings } as const;
};

export { openSettings, PERMISSIONS, RESULTS };
export type { Permission, PermissionStatus };

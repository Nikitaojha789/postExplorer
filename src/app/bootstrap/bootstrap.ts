import { http } from '@/core/api';
import { authHttpHandlers, restoreSession } from '@/core/auth';
import { env } from '@/core/config';
import { initI18n } from '@/core/i18n';
import { bindAppStateToQueries } from '@/core/lifecycle';
import { addLogTransport, consoleTransport, logger } from '@/core/logger';
import { initMonitoring, reportError } from '@/core/monitoring';
import { bindNetworkStatus } from '@/core/network';
import { applyStoredThemePreference } from '@/ui';

let started = false;

/**
 * Synchronous, side-effectful startup — runs once, before the first render.
 * Order matters: logging → monitoring (so later failures are captured) →
 * i18n/theme (first paint is correct) → wiring → async session restore.
 *
 * Keep this lean: everything here delays time-to-first-frame. Defer
 * non-critical work (prefetching, remote config) until after first render.
 */
export const bootstrap = (): void => {
  if (started) return;
  started = true;

  if (__DEV__) addLogTransport(consoleTransport);
  initMonitoring();
  initI18n();
  applyStoredThemePreference();

  http.setAuthHandlers(authHttpHandlers);
  bindNetworkStatus();
  bindAppStateToQueries();

  // `__DEV__` is a compile-time constant: this branch and the mock modules
  // are stripped from release bundles.
  if (__DEV__ && env.USE_MOCK_API) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { registerDevMocks } = require('./mocks') as { registerDevMocks: () => void };
    registerDevMocks();
  }

  restoreSession().catch((error: unknown) => {
    logger.error('Session restore failed', error);
    reportError(error);
  });
};

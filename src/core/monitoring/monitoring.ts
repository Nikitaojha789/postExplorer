import type { ComponentType } from 'react';

import * as Sentry from '@sentry/react-native';

import { env, isProduction } from '@/core/config';
import { addLogTransport, logger, redact, type LogTransport } from '@/core/logger';

/**
 * Vendor-neutral monitoring facade. App code calls `reportError`,
 * `addBreadcrumb`, `setMonitoringUser` — never the Sentry SDK directly — so
 * swapping vendors (Datadog, Crashlytics, Bugsnag) touches this file only.
 *
 * Disabled entirely when no DSN is configured (local dev, forks, CI).
 */
const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: true,
});

let enabled = false;

const scrub = <T>(value: T): T => redact(value) as T;

/** Errors/warnings from the app logger become Sentry events/breadcrumbs. */
const sentryTransport: LogTransport = {
  minLevel: 'info',
  write({ level, message, context, error }) {
    if (level === 'error') {
      Sentry.captureException(error ?? new Error(message), { extra: { message, context } });
      return;
    }
    Sentry.addBreadcrumb({
      category: 'log',
      level: level === 'warn' ? 'warning' : level,
      message,
      data: context as Record<string, unknown> | undefined,
    });
  },
};

export const initMonitoring = (): void => {
  if (!env.SENTRY_DSN || enabled) return;

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.APP_ENV,
    // PII (IP, request bodies, route params) stays off; opt in per field.
    sendDefaultPii: false,
    tracesSampleRate: isProduction ? 0.1 : 1,
    enableAutoSessionTracking: true,
    integrations: [navigationIntegration],
    beforeSend: event => ({
      ...event,
      extra: event.extra && scrub(event.extra),
      request: event.request && scrub(event.request),
      contexts: event.contexts && scrub(event.contexts),
    }),
    beforeBreadcrumb: breadcrumb =>
      // Console output is already routed through the logger; skip duplicates.
      breadcrumb.category === 'console'
        ? null
        : { ...breadcrumb, data: breadcrumb.data && scrub(breadcrumb.data) },
  });

  enabled = true;
  addLogTransport(sentryTransport);
  logger.info('Monitoring initialised', { environment: env.APP_ENV });
};

export const reportError = (error: unknown, context?: Record<string, unknown>): void => {
  if (!enabled) {
    logger.debug('reportError (monitoring disabled)', { error, context });
    return;
  }
  Sentry.captureException(error, context ? { extra: scrub(context) } : undefined);
};

export const addBreadcrumb = (message: string, data?: Record<string, unknown>): void => {
  if (enabled) Sentry.addBreadcrumb({ message, data: data && scrub(data) });
};

/** Identify by opaque id only — never email/phone/name. */
export const setMonitoringUser = (userId: string | null): void => {
  if (enabled) Sentry.setUser(userId ? { id: userId } : null);
};

/** Hook for the NavigationContainer `onReady` (screen-load tracing). */
export const registerNavigationContainer = (ref: unknown): void => {
  if (enabled) navigationIntegration.registerNavigationContainer(ref);
};

/** Wraps the root component (app-start, frames, touch breadcrumbs). */
export const withMonitoring = (Root: ComponentType): ComponentType =>
  env.SENTRY_DSN ? Sentry.wrap(Root) : Root;

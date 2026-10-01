import { logger } from '@/core/logger';

/**
 * Typed analytics. Every event and its properties are declared here, so
 * tracking calls are checked at compile time and the tracking plan is
 * reviewable in one file. Add events as features need them.
 */
export interface AnalyticsEvents {
  sign_in_succeeded: { method: 'password' };
  sign_in_failed: { reason: string };
  signed_out: undefined;
  theme_changed: { preference: string };
  language_changed: { language: string };
}

export type AnalyticsEventName = keyof AnalyticsEvents;

/** Implement this to plug in a vendor (Amplitude, Segment, Firebase…). */
export interface AnalyticsProvider {
  track(event: string, properties?: Record<string, unknown>): void;
  screen(name: string, properties?: Record<string, unknown>): void;
  identify(userId: string): void;
  reset(): void;
}

const devProvider: AnalyticsProvider = {
  track: (event, properties) => logger.debug(`[analytics] ${event}`, properties),
  screen: name => logger.debug(`[analytics] screen ${name}`),
  identify: userId => logger.debug('[analytics] identify', { userId }),
  reset: () => logger.debug('[analytics] reset'),
};

const noopProvider: AnalyticsProvider = {
  track: () => undefined,
  screen: () => undefined,
  identify: () => undefined,
  reset: () => undefined,
};

let provider: AnalyticsProvider = __DEV__ ? devProvider : noopProvider;

export const setAnalyticsProvider = (next: AnalyticsProvider): void => {
  provider = next;
};

type TrackArgs<E extends AnalyticsEventName> = AnalyticsEvents[E] extends undefined
  ? [event: E]
  : [event: E, properties: AnalyticsEvents[E]];

export const analytics = {
  track: <E extends AnalyticsEventName>(...[event, properties]: TrackArgs<E>) =>
    provider.track(event, properties),
  screen: (name: string) => provider.screen(name),
  identify: (userId: string) => provider.identify(userId),
  reset: () => provider.reset(),
} as const;

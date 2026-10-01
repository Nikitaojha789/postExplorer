/**
 * Every persisted key lives here — no string literals at call sites, so keys
 * can't collide and migrations have one place to look.
 */
export const StorageKeys = {
  themePreference: 'ui.themePreference',
  language: 'i18n.language',
  featureFlags: 'featureFlags.overrides',
  queryCache: 'query.cache',
  sessionUser: 'auth.user',
} as const;

export const SecureKeys = {
  refreshToken: 'auth.refreshToken',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

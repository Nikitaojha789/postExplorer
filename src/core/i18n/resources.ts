import ar from './locales/ar.json';
import en from './locales/en.json';

/**
 * `en` is the source of truth; types for `t()` keys are derived from it.
 * Parked translations in `locales/disabled/` are not imported (not bundled).
 */
export const resources = {
  en: { translation: en },
  ar: { translation: ar },
} as const;

export const defaultNS = 'translation';

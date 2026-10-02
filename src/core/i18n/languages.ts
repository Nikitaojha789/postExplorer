interface LanguageInfo {
  nativeName: string;
  direction: 'ltr' | 'rtl';
}

/**
 * Languages bundled into the app. To ship a single language:
 *
 * 1. Set `LANGUAGE_SWITCHING_ENABLED = false`. Detection then always uses
 *    `DEFAULT_LANGUAGE` (a device set to Arabic can't trigger an RTL
 *    restart), `changeLanguage` is a no-op and Settings hides the picker.
 * 2. Optionally "park" a translation so it stops costing bundle size and
 *    stops failing `npm run i18n:check` on new keys: move its JSON to
 *    `locales/disabled/` and remove it here, from `resources.ts` and its
 *    plural data from `app/bootstrap/polyfills.ts`.
 *
 * To re-enable: translate the missing keys (`npm run i18n:check` lists
 * them), undo step 2, then flip the flag back.
 */
export const SUPPORTED_LANGUAGES = {
  en: { nativeName: 'English', direction: 'ltr' },
  ar: { nativeName: 'العربية', direction: 'rtl' },
} as const satisfies Record<string, LanguageInfo>;

/** Gate for device-language detection and the in-app language picker. */
// `as boolean` keeps checks against it from being flagged as always-true.
export const LANGUAGE_SWITCHING_ENABLED = true as boolean;

export type Language = keyof typeof SUPPORTED_LANGUAGES;
export const DEFAULT_LANGUAGE: Language = 'en';
export const LANGUAGE_CODES = Object.keys(SUPPORTED_LANGUAGES) as Language[];

export const isSupportedLanguage = (value: unknown): value is Language =>
  typeof value === 'string' && value in SUPPORTED_LANGUAGES;

export const isRtlLanguage = (language: Language): boolean => {
  // Widened so this still compiles when only LTR languages remain.
  const info: LanguageInfo = SUPPORTED_LANGUAGES[language];
  return info.direction === 'rtl';
};

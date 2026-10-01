export const SUPPORTED_LANGUAGES = {
  en: { nativeName: 'English', direction: 'ltr' },
  ar: { nativeName: 'العربية', direction: 'rtl' },
} as const;

export type Language = keyof typeof SUPPORTED_LANGUAGES;
export const DEFAULT_LANGUAGE: Language = 'en';
export const LANGUAGE_CODES = Object.keys(SUPPORTED_LANGUAGES) as Language[];

export const isSupportedLanguage = (value: unknown): value is Language =>
  typeof value === 'string' && value in SUPPORTED_LANGUAGES;

export const isRtlLanguage = (language: Language): boolean =>
  SUPPORTED_LANGUAGES[language].direction === 'rtl';

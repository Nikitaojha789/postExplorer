import { I18nManager } from 'react-native';

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { findBestLanguageTag } from 'react-native-localize';
import RNRestart from 'react-native-restart';

import { logger } from '@/core/logger';
import { appStorage, StorageKeys } from '@/core/storage';

import {
  DEFAULT_LANGUAGE,
  isRtlLanguage,
  isSupportedLanguage,
  LANGUAGE_CODES,
  type Language,
} from './languages';
import { defaultNS, resources } from './resources';

/**
 * RTL strategy (see docs/ARCHITECTURE.md → Internationalisation):
 * native layout direction follows the language via I18nManager, and all
 * styles use logical props (start/end, marginStart…). Switching between
 * languages of the SAME direction is instant; switching direction requires
 * a restart, which is the only way RN applies it to native views, headers,
 * gestures and third-party components consistently.
 */
const RTL_RESTART_GUARD = 'i18n.rtlRestartGuard';

const detectLanguage = (): Language => {
  const stored = appStorage.getString(StorageKeys.language);
  if (isSupportedLanguage(stored)) return stored;
  // Validate rather than trust: tags can come back regionalised ("en-US").
  const best = findBestLanguageTag(LANGUAGE_CODES)?.languageTag;
  const base = best?.split('-')[0];
  if (isSupportedLanguage(best)) return best;
  return isSupportedLanguage(base) ? base : DEFAULT_LANGUAGE;
};

/** Aligns native direction with the language. Returns true if a restart is needed. */
const applyDirection = (language: Language): boolean => {
  const rtl = isRtlLanguage(language);
  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);
  return I18nManager.isRTL !== rtl;
};

export const initI18n = (): void => {
  const language = detectLanguage();

  void i18next.use(initReactI18next).init({
    resources,
    defaultNS,
    lng: language,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: LANGUAGE_CODES,
    interpolation: { escapeValue: false }, // React already escapes.
    returnNull: false,
    initAsync: false, // Resources are bundled: init synchronously, no flash.
  });

  // First launch on an RTL device (or a stale native flag): restart once.
  if (applyDirection(language)) {
    if (appStorage.getString(RTL_RESTART_GUARD) === language) {
      logger.warn('RTL direction still mismatched after restart; continuing', { language });
      return;
    }
    appStorage.setString(RTL_RESTART_GUARD, language);
    RNRestart.restart();
    return;
  }
  appStorage.remove(RTL_RESTART_GUARD);
};

export const getCurrentLanguage = (): Language =>
  isSupportedLanguage(i18next.language) ? i18next.language : DEFAULT_LANGUAGE;

/** Persists and applies a language. Resolves `true` if the app will restart. */
export const changeLanguage = async (language: Language): Promise<boolean> => {
  appStorage.setString(StorageKeys.language, language);
  await i18next.changeLanguage(language);
  if (applyDirection(language)) {
    RNRestart.restart();
    return true;
  }
  return false;
};

export const requiresRestartFor = (language: Language): boolean =>
  isRtlLanguage(language) !== I18nManager.isRTL;

export { i18next as i18n };

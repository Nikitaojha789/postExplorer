import type * as Storage from '@/core/storage';

import type * as I18n from './i18n';

type I18nModule = typeof I18n;
type StorageModule = typeof Storage;

/**
 * Loads a fresh i18n module with the switching gate set as given, on a
 * device where Arabic was chosen earlier. Storage is seeded inside the
 * isolated registry: it has its own in-memory MMKV instance.
 */
const loadI18n = (switchingEnabled: boolean): I18nModule => {
  let mod: I18nModule | undefined;
  jest.isolateModules(() => {
    jest.doMock('./languages', () => ({
      ...jest.requireActual<object>('./languages'),
      LANGUAGE_SWITCHING_ENABLED: switchingEnabled,
    }));
    const { appStorage, StorageKeys } = jest.requireActual<StorageModule>('@/core/storage');
    appStorage.setString(StorageKeys.language, 'ar');
    mod = jest.requireActual<I18nModule>('./i18n');
  });
  if (!mod) throw new Error('i18n module failed to load');
  return mod;
};

afterEach(() => {
  jest.dontMock('./languages');
});

describe('language switching gate', () => {
  it('uses the stored language when switching is enabled', () => {
    const i18n = loadI18n(true);
    i18n.initI18n();
    expect(i18n.getCurrentLanguage()).toBe('ar');
  });

  it('ignores stored/device languages and refuses changes when disabled', async () => {
    const i18n = loadI18n(false);
    i18n.initI18n();
    expect(i18n.getCurrentLanguage()).toBe('en');

    await expect(i18n.changeLanguage('ar')).resolves.toBe(false);
    expect(i18n.getCurrentLanguage()).toBe('en');
  });
});

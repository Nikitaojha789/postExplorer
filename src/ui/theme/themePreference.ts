import { Appearance } from 'react-native';

import { z } from 'zod';
import { create } from 'zustand';

import { appStorage, StorageKeys } from '@/core/storage';

export const ThemePreferenceSchema = z.enum(['system', 'light', 'dark']);
export type ThemePreference = z.infer<typeof ThemePreferenceSchema>;

const readStored = (): ThemePreference => {
  const parsed = ThemePreferenceSchema.safeParse(appStorage.getString(StorageKeys.themePreference));
  return parsed.success ? parsed.data : 'system';
};

const usePreferenceStore = create<{ preference: ThemePreference }>()(() => ({
  preference: readStored(),
}));

/**
 * Pushes the preference into the native Appearance override, so BOTH our
 * `useColorScheme()`-driven theme and native UI (alerts, pickers, keyboard,
 * status bar) follow the in-app choice without a React context.
 */
const applyToNative = (preference: ThemePreference) => {
  Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
};

/** Call once before first render (bootstrap) to avoid a light→dark flash. */
export const applyStoredThemePreference = (): void => {
  applyToNative(usePreferenceStore.getState().preference);
};

export const setThemePreference = (preference: ThemePreference): void => {
  appStorage.setString(StorageKeys.themePreference, preference);
  applyToNative(preference);
  usePreferenceStore.setState({ preference });
};

export const useThemePreference = (): ThemePreference =>
  usePreferenceStore(state => state.preference);

import { DarkTheme, DefaultTheme, type Theme as NavigationTheme } from '@react-navigation/native';

import { themes, type ColorScheme } from './themes';

/** React Navigation themes derived from ours — prevents white flashes in dark mode. */
const build = (scheme: ColorScheme): NavigationTheme => {
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const { colors } = themes[scheme];
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
  };
};

export const navigationThemes: Readonly<Record<ColorScheme, NavigationTheme>> = {
  light: build('light'),
  dark: build('dark'),
};

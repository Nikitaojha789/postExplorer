import {
  StyleSheet,
  useColorScheme,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { themes, type ColorScheme, type Theme } from './themes';

export const useColorSchemeName = (): ColorScheme =>
  useColorScheme() === 'dark' ? 'dark' : 'light';

/**
 * Current theme. Components re-render only when the colour scheme actually
 * changes (rare), and the returned objects are module-level constants, so
 * they are referentially stable between renders.
 */
export const useTheme = (): Theme => themes[useColorSchemeName()];

/**
 * Themed StyleSheet factory. Both variants are built ONCE at module load
 * (StyleSheet.create is not free) — rendering just picks a reference:
 *
 *   const useStyles = makeStyles(theme => ({ card: { backgroundColor: theme.colors.surface } }));
 *   const styles = useStyles();
 *
 * Keep truly dynamic values (animated, per-item) out of the factory.
 */
type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export const makeStyles = <T extends NamedStyles<T>>(
  factory: (theme: Theme) => T & NamedStyles<T>,
) => {
  const sheets: Record<ColorScheme, T> = {
    light: StyleSheet.create(factory(themes.light)),
    dark: StyleSheet.create(factory(themes.dark)),
  };
  return (): T => sheets[useColorSchemeName()];
};

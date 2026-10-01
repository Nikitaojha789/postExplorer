/**
 * Design tokens: theme-agnostic primitives. Components never read these
 * colours directly — they read semantic roles from `theme.colors`, which map
 * onto this palette per colour scheme. Rebrand by editing this file only.
 */
export const palette = {
  brand50: '#EEF4FF',
  brand100: '#D9E6FF',
  brand200: '#B3CCFF',
  brand300: '#80A8FF',
  brand400: '#4D84FF',
  brand500: '#2563EB',
  brand600: '#1D4FC4',
  brand700: '#173E9A',
  brand800: '#112E73',
  brand900: '#0B1F4D',

  neutral0: '#FFFFFF',
  neutral50: '#F7F8FA',
  neutral100: '#EEF0F3',
  neutral200: '#DDE1E7',
  neutral300: '#C3C9D2',
  neutral400: '#98A1AE',
  neutral500: '#6B7482',
  neutral600: '#4B5360',
  neutral700: '#343A44',
  neutral800: '#1F242B',
  neutral900: '#12151A',
  neutral1000: '#000000',

  red500: '#DC2626',
  red400: '#F87171',
  green500: '#16A34A',
  green400: '#4ADE80',
  amber500: '#D97706',
  amber400: '#FBBF24',
} as const;

/** 4-pt spacing scale. */
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

/**
 * System fonts by default (zero bundle cost, best rendering per platform).
 * When adding a custom font, set the family names here and register the
 * files via `react-native.config.js` → `assets`.
 */
export const fontFamily = {
  regular: undefined,
  medium: undefined,
  semibold: undefined,
  bold: undefined,
} as const satisfies Record<string, string | undefined>;

export const typography = {
  display: { fontSize: 32, lineHeight: 40, fontWeight: '700' },
  title1: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  title2: { fontSize: 20, lineHeight: 28, fontWeight: '600' },
  title3: { fontSize: 17, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  callout: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
} as const;

export type TypographyVariant = keyof typeof typography;

/** Durations in ms. Keep UI motion short; long animations feel sluggish. */
export const motion = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

/** Minimum touch target (Apple HIG 44pt, Material 48dp → use 48). */
export const MIN_TOUCH_TARGET = 48;

export type Spacing = keyof typeof spacing;
export type Radius = keyof typeof radius;

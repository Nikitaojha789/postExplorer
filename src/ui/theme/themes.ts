import { motion, palette, radius, spacing, typography } from './tokens';

/**
 * Semantic colour roles. Keep this list SHORT and generic — a role describes
 * intent ("surface", "danger"), never a screen ("bookingCardShadow"). If a
 * feature needs a one-off colour, derive it from these roles locally.
 */
export interface ColorRoles {
  background: string;
  surface: string;
  surfaceRaised: string;
  surfaceSunken: string;
  border: string;
  borderStrong: string;

  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  primary: string;
  primaryPressed: string;
  onPrimary: string;
  primarySubtle: string;

  danger: string;
  onDanger: string;
  success: string;
  warning: string;

  disabled: string;
  onDisabled: string;
  overlay: string;
  focus: string;
}

export type ColorScheme = 'light' | 'dark';

export interface Theme {
  scheme: ColorScheme;
  colors: ColorRoles;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  motion: typeof motion;
}

const light: ColorRoles = {
  background: palette.neutral50,
  surface: palette.neutral0,
  surfaceRaised: palette.neutral0,
  surfaceSunken: palette.neutral100,
  border: palette.neutral200,
  borderStrong: palette.neutral300,

  text: palette.neutral900,
  textSecondary: palette.neutral600,
  textMuted: palette.neutral500,
  textInverse: palette.neutral0,

  primary: palette.brand500,
  primaryPressed: palette.brand600,
  onPrimary: palette.neutral0,
  primarySubtle: palette.brand50,

  danger: palette.red500,
  onDanger: palette.neutral0,
  success: palette.green500,
  warning: palette.amber500,

  disabled: palette.neutral200,
  onDisabled: palette.neutral500,
  overlay: 'rgba(18, 21, 26, 0.5)',
  focus: palette.brand300,
};

const dark: ColorRoles = {
  background: palette.neutral900,
  surface: palette.neutral800,
  surfaceRaised: palette.neutral700,
  surfaceSunken: palette.neutral1000,
  border: palette.neutral700,
  borderStrong: palette.neutral600,

  text: palette.neutral50,
  textSecondary: palette.neutral300,
  textMuted: palette.neutral400,
  textInverse: palette.neutral900,

  primary: palette.brand400,
  primaryPressed: palette.brand300,
  onPrimary: palette.neutral1000,
  primarySubtle: palette.brand900,

  danger: palette.red400,
  onDanger: palette.neutral1000,
  success: palette.green400,
  warning: palette.amber400,

  disabled: palette.neutral700,
  onDisabled: palette.neutral400,
  overlay: 'rgba(0, 0, 0, 0.6)',
  focus: palette.brand400,
};

const build = (scheme: ColorScheme, colors: ColorRoles): Theme => ({
  scheme,
  colors,
  spacing,
  radius,
  typography,
  motion,
});

export const themes: Readonly<Record<ColorScheme, Theme>> = {
  light: build('light', light),
  dark: build('dark', dark),
};

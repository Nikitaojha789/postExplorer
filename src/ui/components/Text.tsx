import { memo } from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme, type ColorRoles, type TypographyVariant } from '@/ui/theme';

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  /** Semantic colour role; defaults to `text`. */
  color?: keyof ColorRoles;
  /** Logical alignment: `start`/`end` follow the layout direction (LTR/RTL). */
  align?: 'start' | 'center' | 'end';
}

// Under RTL, React Native treats `left`/`right` as start/end and swaps them
// (`I18nManager.doLeftAndRightSwapInRTL`, default true; see Fabric's
// RCTResolveTextAlignment). `auto` is NOT reliable: on iOS it resolved to
// left in RTL during device testing. So logical alignment maps to left/right.
const TEXT_ALIGN = { start: 'left', center: 'center', end: 'right' } as const;

/**
 * The only text primitive app code should use. Applies typography, theme
 * colour and a font-scaling cap (Dynamic Type stays supported, but layouts
 * can't explode past 2x). Alignment is logical (`start` = reading start).
 */
export const Text = memo(function Text({
  variant = 'body',
  color = 'text',
  align = 'start',
  style,
  maxFontSizeMultiplier = 2,
  ...rest
}: TextProps) {
  const theme = useTheme();
  return (
    <RNText
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[
        theme.typography[variant],
        { color: theme.colors[color], textAlign: TEXT_ALIGN[align] },
        style,
      ]}
      {...rest}
    />
  );
});

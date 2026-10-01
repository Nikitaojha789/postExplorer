import { memo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { makeStyles, MIN_TOUCH_TARGET, useTheme } from '@/ui/theme';

import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  title: string;
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Button = memo(function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  fullWidth = false,
  style,
  ...rest
}: ButtonProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const isDisabled = disabled === true || loading;

  const foreground = isDisabled
    ? colors.onDisabled
    : variant === 'primary'
      ? colors.onPrimary
      : variant === 'danger'
        ? colors.onDanger
        : colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !isDisabled && styles[`${variant}Pressed`],
        isDisabled && styles.disabled,
        fullWidth && styles.fullWidth,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <Text variant="bodyStrong" style={{ color: foreground }} numberOfLines={1}>
          {title}
        </Text>
      )}
    </Pressable>
  );
});

const useStyles = makeStyles(({ colors, radius, spacing }) => ({
  base: {
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: { alignSelf: 'stretch' },
  primary: { backgroundColor: colors.primary },
  primaryPressed: { backgroundColor: colors.primaryPressed },
  secondary: { backgroundColor: colors.primarySubtle },
  secondaryPressed: { opacity: 0.8 },
  ghost: { backgroundColor: 'transparent' },
  ghostPressed: { backgroundColor: colors.surfaceSunken },
  danger: { backgroundColor: colors.danger },
  dangerPressed: { opacity: 0.85 },
  disabled: { backgroundColor: colors.disabled },
}));

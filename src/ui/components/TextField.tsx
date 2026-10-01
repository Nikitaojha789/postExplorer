import { memo, useState, type ComponentRef, type Ref } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { makeStyles, MIN_TOUCH_TARGET, useTheme } from '@/ui/theme';

import { Text } from './Text';

export type TextFieldRef = ComponentRef<typeof TextInput>;

export interface TextFieldProps extends TextInputProps {
  label: string;
  /** Already-translated error message; renders the field in an error state. */
  error?: string;
  ref?: Ref<TextFieldRef>;
}

export const TextField = memo(function TextField({
  label,
  error,
  style,
  onFocus,
  onBlur,
  ref,
  ...rest
}: TextFieldProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text variant="label" color="textSecondary" nativeID={`${label}-label`}>
        {label}
      </Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        accessibilityLabelledBy={`${label}-label`}
        accessibilityHint={error}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.primary}
        maxFontSizeMultiplier={2}
        style={[
          styles.input,
          focused && styles.focused,
          error !== undefined && styles.invalid,
          style,
        ]}
        onFocus={event => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={event => {
          setFocused(false);
          onBlur?.(event);
        }}
        {...rest}
      />
      {error !== undefined && (
        <Text
          variant="caption"
          color="danger"
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          {error}
        </Text>
      )}
    </View>
  );
});

const useStyles = makeStyles(({ colors, radius, spacing, typography }) => ({
  container: { gap: spacing.xs },
  input: {
    ...typography.body,
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    // `left` = reading start: RN swaps left/right under RTL (see Text.tsx).
    textAlign: 'left',
  },
  focused: { borderColor: colors.primary },
  invalid: { borderColor: colors.danger },
}));

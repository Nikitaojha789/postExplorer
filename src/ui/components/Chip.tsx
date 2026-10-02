import { memo, type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { makeStyles, MIN_TOUCH_TARGET } from '@/ui/theme';

import { Text } from './Text';

const CHIP_HEIGHT = 36;

export interface ChipProps {
  /** Already-translated label. */
  label: string;
  selected?: boolean;
  /** Receives `value` so a parent can pass ONE stable handler to every chip. */
  onPress?: (value: string) => void;
  /** Defaults to `label`. */
  value?: string;
  testID?: string;
}

/** Compact selectable pill (filters, sort options). Without `onPress` it is a static tag. */
export const Chip = memo(function Chip({
  label,
  selected = false,
  onPress,
  value,
  testID,
}: ChipProps) {
  const styles = useStyles();
  const content = (
    <Text variant="label" color={selected ? 'onPrimary' : 'text'} numberOfLines={1}>
      {label}
    </Text>
  );
  if (!onPress) {
    return (
      <View testID={testID} style={[styles.chip, styles.static]}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      // Visual height stays compact; the touch target still reaches 48dp.
      hitSlop={(MIN_TOUCH_TARGET - CHIP_HEIGHT) / 2}
      onPress={() => onPress(value ?? label)}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && !selected && styles.pressed,
      ]}
    >
      {content}
    </Pressable>
  );
});

export interface ChipRowProps {
  children: ReactNode;
  testID?: string;
}

/**
 * Horizontally scrolling row of chips. Use it instead of a bare horizontal
 * ScrollView: RN's ScrollView defaults to `flexGrow: 1`, so as a direct child
 * of a flex column it takes a share of the screen height and stretches every
 * chip into a tall pill. That only shows on a device — Jest has no layout.
 */
export function ChipRow({ children, testID }: ChipRowProps) {
  const styles = useStyles();
  return (
    <ScrollView
      testID={testID}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      style={styles.row}
      contentContainerStyle={styles.rowContent}
    >
      {children}
    </ScrollView>
  );
}

const useStyles = makeStyles(({ colors, radius, spacing }) => ({
  chip: {
    minHeight: CHIP_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  static: { minHeight: 28, paddingHorizontal: spacing.sm },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  pressed: { backgroundColor: colors.surfaceSunken },
  row: { flexGrow: 0, flexShrink: 0 },
  rowContent: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
}));

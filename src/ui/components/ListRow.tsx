import { memo, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { makeStyles, MIN_TOUCH_TARGET } from '@/ui/theme';

import { Text } from './Text';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Trailing value text or element (e.g. checkmark, switch). */
  trailing?: ReactNode;
  onPress?: () => void;
  selected?: boolean;
  testID?: string;
}

export const ListRow = memo(function ListRow({
  title,
  subtitle,
  trailing,
  onPress,
  selected,
  testID,
}: ListRowProps) {
  const styles = useStyles();
  const content = (
    <>
      <View style={styles.texts}>
        <Text numberOfLines={1}>{title}</Text>
        {subtitle !== undefined && (
          <Text variant="caption" color="textSecondary" numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
      {typeof trailing === 'string' ? <Text color="textSecondary">{trailing}</Text> : trailing}
    </>
  );

  if (!onPress) {
    return (
      <View style={styles.row} testID={testID}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={selected === undefined ? undefined : { selected }}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
});

const useStyles = makeStyles(({ colors, spacing }) => ({
  row: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.surfaceSunken },
  texts: { flex: 1, gap: spacing.xxs },
}));

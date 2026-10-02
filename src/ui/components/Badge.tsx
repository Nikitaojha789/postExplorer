import { memo } from 'react';

import Animated, { ZoomIn } from 'react-native-reanimated';

import { makeStyles } from '@/ui/theme';

import { Text } from './Text';

const MAX_DISPLAY = 99;

export interface BadgeProps {
  count: number;
  testID?: string;
}

/**
 * Count badge (cart, unread…); renders nothing at 0. Keyed by value so each
 * change re-mounts it with a UI-thread entering animation — a "pop" with no
 * JS work per frame. Give its container an accessibilityLabel with the count.
 */
export const Badge = memo(function Badge({ count, testID }: BadgeProps) {
  const styles = useStyles();
  if (count <= 0) return null;
  return (
    <Animated.View key={count} entering={ZoomIn.springify()} style={styles.badge} testID={testID}>
      <Text variant="caption" color="onDanger" style={styles.text}>
        {count > MAX_DISPLAY ? `${MAX_DISPLAY}+` : count}
      </Text>
    </Animated.View>
  );
});

const useStyles = makeStyles(({ colors, radius, spacing }) => ({
  badge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontWeight: '700', lineHeight: 14 },
}));

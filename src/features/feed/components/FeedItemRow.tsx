import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { Image, makeStyles, Text } from '@/ui';

import type { FeedItem } from '../api/feedApi';

export const FEED_THUMBNAIL_SIZE = 56;

interface Props {
  item: FeedItem;
  onPress: (id: string) => void;
}

/**
 * List rows are memoised and receive a STABLE `onPress(id)` from the screen
 * instead of a per-row closure, so scrolling never re-renders visible rows.
 */
export const FeedItemRow = memo(function FeedItemRow({ item, onPress }: Props) {
  const styles = useStyles();
  return (
    <Pressable
      testID={`feed-item-${item.id}`}
      onPress={() => onPress(item.id)}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Image source={item.thumbnailUrl} style={styles.thumbnail} accessibilityLabel={null} />
      <View style={styles.texts}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {item.title}
        </Text>
        <Text variant="caption" color="textSecondary" numberOfLines={2}>
          {item.summary}
        </Text>
      </View>
    </Pressable>
  );
});

const useStyles = makeStyles(({ colors, radius, spacing }) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.surfaceSunken },
  thumbnail: {
    width: FEED_THUMBNAIL_SIZE,
    height: FEED_THUMBNAIL_SIZE,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSunken,
  },
  texts: { flex: 1, gap: spacing.xxs },
}));

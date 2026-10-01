import type { StaticScreenProps } from '@react-navigation/native';

import { ErrorState, Image, LoadingState, makeStyles, Screen, Text } from '@/ui';

import { useFeedItem } from '../hooks/useFeed';

const HERO_HEIGHT = 220;

/** Reachable from the feed and via deep link: `<scheme>://items/:id`. */
type Props = StaticScreenProps<{ id: string }>;

export function FeedItemScreen({ route }: Props) {
  const styles = useStyles();
  const { data: item, error, isPending, refetch } = useFeedItem(route.params.id);

  if (isPending) return <LoadingState />;
  if (!item) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <Screen preset="scroll" padded={false} edges={['bottom']} testID="feed-item-screen">
      <Image
        source={item.imageUrl}
        style={styles.hero}
        accessibilityLabel={item.title}
        priority="high"
      />
      <Text variant="title2" accessibilityRole="header" style={styles.block}>
        {item.title}
      </Text>
      <Text color="textSecondary" style={styles.block}>
        {item.summary}
      </Text>
    </Screen>
  );
}

const useStyles = makeStyles(({ colors, spacing }) => ({
  hero: { width: '100%', height: HERO_HEIGHT, backgroundColor: colors.surfaceSunken },
  block: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
}));

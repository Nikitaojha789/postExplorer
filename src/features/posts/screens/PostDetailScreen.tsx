import { View } from 'react-native';

import type { StaticScreenProps } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Chip, EmptyState, ErrorState, LoadingState, makeStyles, Screen, Text } from '@/ui';

import { usePost } from '../hooks/usePosts';

type Props = StaticScreenProps<{ id: number }>;

export function PostDetailScreen({ route }: Props) {
  const styles = useStyles();
  const { t } = useTranslation();
  const rawId = route.params.id;
  const numericId = Number(rawId);
  const isValidId = Number.isInteger(numericId) && numericId > 0;

  const { data: post, error, isPending, refetch } = usePost(numericId, { enabled: isValidId });

  if (!isValidId) {
    return (
      <Screen preset="scroll" edges={['bottom']} testID="post-detail-screen">
        <EmptyState title={t('posts.invalidIdTitle')} message={t('posts.invalidIdMessage')} />
      </Screen>
    );
  }

  if (isPending && !post) {
    return <LoadingState message={t('posts.loadingDetail')} />;
  }

  if (error && !post) {
    return <ErrorState error={error} onRetry={() => void refetch()} />;
  }

  if (!post) {
    return (
      <Screen preset="scroll" edges={['bottom']} testID="post-detail-screen">
        <EmptyState title={t('posts.notFoundTitle')} message={t('posts.notFoundMessage')} />
      </Screen>
    );
  }

  return (
    <Screen preset="scroll" edges={['bottom']} testID="post-detail-screen">
      <View style={styles.card}>
        <View style={styles.metaRow}>
          <Chip label={`Post #${post.id}`} />
          <Chip label={`User #${post.userId}`} />
        </View>
        <Text variant="title1" accessibilityRole="header" style={styles.title}>
          {post.title}
        </Text>
        <View style={styles.divider} />
        <Text variant="body" color="text" style={styles.body}>
          {post.body}
        </Text>
      </View>
    </Screen>
  );
}

const useStyles = makeStyles(({ colors, radius, spacing }) => ({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  title: {
    textTransform: 'capitalize',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  body: {
    lineHeight: 26,
  },
}));

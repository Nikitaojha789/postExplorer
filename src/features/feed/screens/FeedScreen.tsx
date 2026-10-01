import { useCallback } from 'react';
import { RefreshControl, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';

import { useRefreshOnFocus } from '@/core/api';
import { EmptyState, ErrorState, LoadingState, makeStyles, Screen, useTheme } from '@/ui';

import type { FeedItem } from '../api/feedApi';
import { FeedItemRow } from '../components/FeedItemRow';
import { useFeed } from '../hooks/useFeed';

const keyExtractor = (item: FeedItem) => item.id;

export function FeedScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const {
    data,
    error,
    isPending,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFeed();

  useRefreshOnFocus(refetch);

  const openItem = useCallback(
    (id: string) => navigation.navigate('FeedItem', { id }),
    [navigation],
  );

  const renderItem = useCallback<ListRenderItem<FeedItem>>(
    ({ item }) => <FeedItemRow item={item} onPress={openItem} />,
    [openItem],
  );

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isPending) return <LoadingState />;
  // Only replace the list with an error when there is nothing cached to show.
  if (error && !data) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <Screen padded={false} testID="feed-screen">
      <FlashList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          <EmptyState title={t('feed.emptyTitle')} message={t('feed.emptyMessage')} />
        }
        ListFooterComponent={isFetchingNextPage ? <LoadingFooter /> : null}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.content}
      />
    </Screen>
  );
}

function Separator() {
  const styles = useStyles();
  return <View style={styles.separator} />;
}

function LoadingFooter() {
  const styles = useStyles();
  return (
    <View style={styles.footer}>
      <LoadingState testID="feed-loading-more" />
    </View>
  );
}

const useStyles = makeStyles(({ colors, spacing }) => ({
  content: { paddingBottom: spacing.xl },
  separator: { height: 1, backgroundColor: colors.border, marginStart: spacing.lg },
  footer: { height: 72 },
}));

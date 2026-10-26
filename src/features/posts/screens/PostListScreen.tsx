import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';

import { useRefreshOnFocus } from '@/core/api';
import {
  Button,
  Chip,
  ChipRow,
  EmptyState,
  ErrorState,
  LoadingState,
  makeStyles,
  Screen,
  Text,
  TextField,
  useTheme,
} from '@/ui';

import type { Post } from '../api/postsApi';
import { PostCard } from '../components/PostCard';
import { usePostInteractions } from '../hooks/usePostInteractions';
import { usePosts } from '../hooks/usePosts';

type PostFilter = 'all' | 'bookmarked' | `user_${number}`;

const keyExtractor = (item: Post) => String(item.id);

export function PostListScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<PostFilter>('all');

  const { data, error, isPending, isRefetching, refetch } = usePosts();
  const bookmarkedPosts = usePostInteractions(s => s.bookmarkedPosts);

  useRefreshOnFocus(refetch);

  const openPost = useCallback(
    (id: number) => {
      navigation.navigate('PostDetail', { id });
    },
    [navigation],
  );

  const renderItem = useCallback<ListRenderItem<Post>>(
    ({ item }) => <PostCard post={item} onPress={openPost} />,
    [openPost],
  );

  // Filter posts by search query and category chip
  const filteredPosts = useMemo(() => {
    if (!data) return [];
    return data.filter(post => {
      // Category filter
      if (selectedFilter === 'bookmarked' && !bookmarkedPosts[post.id]) {
        return false;
      }
      if (
        selectedFilter.startsWith('user_') &&
        post.userId !== Number(selectedFilter.replace('user_', ''))
      ) {
        return false;
      }

      // Search keyword filter
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = post.title.toLowerCase().includes(query);
        const matchesBody = post.body.toLowerCase().includes(query);
        const matchesId = String(post.id) === query || `user ${post.userId}`.includes(query);
        return matchesTitle || matchesBody || matchesId;
      }

      return true;
    });
  }, [data, selectedFilter, bookmarkedPosts, searchQuery]);

  if (isPending) {
    return <LoadingState message={t('posts.loadingList')} />;
  }

  if (error && !data) {
    return <ErrorState error={error} onRetry={() => void refetch()} />;
  }

  const hasActiveFilters = searchQuery.length > 0 || selectedFilter !== 'all';

  return (
    <Screen padded={false} edges={['bottom']} testID="post-list-screen">
      {/* Search Input Box */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextField
            accessibilityLabel={t('posts.searchPlaceholder')}
            autoCorrect={false}
            clearButtonMode="while-editing"
            containerStyle={styles.searchFieldContainer}
            onChangeText={setSearchQuery}
            placeholder={t('posts.searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            value={searchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable hitSlop={10} onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Text style={styles.clearIcon}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Filter Chips Bar */}
      <View style={styles.filterBar}>
        <ChipRow>
          <Chip
            label={t('posts.filterAll')}
            selected={selectedFilter === 'all'}
            onPress={() => setSelectedFilter('all')}
          />
          <Chip
            label={`★ ${t('posts.filterBookmarked')}`}
            selected={selectedFilter === 'bookmarked'}
            onPress={() => setSelectedFilter('bookmarked')}
          />
          <Chip
            label="User 1"
            selected={selectedFilter === 'user_1'}
            onPress={() => setSelectedFilter(selectedFilter === 'user_1' ? 'all' : 'user_1')}
          />
          <Chip
            label="User 2"
            selected={selectedFilter === 'user_2'}
            onPress={() => setSelectedFilter(selectedFilter === 'user_2' ? 'all' : 'user_2')}
          />
          <Chip
            label="User 3"
            selected={selectedFilter === 'user_3'}
            onPress={() => setSelectedFilter(selectedFilter === 'user_3' ? 'all' : 'user_3')}
          />
        </ChipRow>
      </View>

      {/* Count Indicator */}
      <View style={styles.countRow}>
        <Text variant="caption" color="textMuted">
          {filteredPosts.length === 1 ? '1 post found' : `${filteredPosts.length} posts found`}
        </Text>
        {hasActiveFilters && (
          <Pressable
            hitSlop={8}
            onPress={() => {
              setSearchQuery('');
              setSelectedFilter('all');
            }}
          >
            <Text variant="caption" color="primary" style={styles.resetText}>
              {t('posts.clearSearch')}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Posts FlashList */}
      <FlashList
        data={filteredPosts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          hasActiveFilters ? (
            <View style={styles.emptyContainer}>
              <EmptyState title={t('posts.noSearchResults')} message={t('posts.emptyMessage')} />
              <Button
                title={t('posts.clearSearch')}
                variant="secondary"
                onPress={() => {
                  setSearchQuery('');
                  setSelectedFilter('all');
                }}
              />
            </View>
          ) : (
            <EmptyState title={t('posts.emptyTitle')} message={t('posts.emptyMessage')} />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    </Screen>
  );
}

function Separator() {
  const styles = useStyles();
  return <View style={styles.separator} />;
}

const useStyles = makeStyles(({ colors, radius, spacing, typography }) => ({
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    backgroundColor: colors.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 44,
    gap: spacing.sm,
  },
  searchIcon: {
    fontSize: 14,
  },
  searchFieldContainer: {
    flex: 1,
    gap: 0,
  },
  searchInput: {
    ...typography.body,
    flex: 1,
    minHeight: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    color: colors.text,
  },
  clearButton: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearIcon: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  filterBar: {
    paddingBottom: spacing.xs,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  resetText: {
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  separator: {
    height: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
}));

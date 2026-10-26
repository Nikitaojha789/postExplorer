import { memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { makeStyles, Text, toast } from '@/ui';

import type { Post } from '../api/postsApi';
import { usePostInteractions } from '../hooks/usePostInteractions';

export interface PostCardProps {
  post: Post;
  onPress: (id: number) => void;
}

const AVATAR_COLORS = [
  '#2563EB', // Blue
  '#7C3AED', // Violet
  '#059669', // Emerald
  '#D97706', // Amber
  '#DB2777', // Pink
  '#0891B2', // Cyan
  '#4F46E5', // Indigo
  '#EA580C', // Orange
] as const;

export const PostCard = memo(function PostCard({ post, onPress }: PostCardProps) {
  const styles = useStyles();
  const { t } = useTranslation();

  const isLiked = usePostInteractions(s => Boolean(s.likedPosts[post.id]));
  const likeCount = usePostInteractions(
    s => s.likeCounts[post.id] ?? ((post.id * 7 + 13) % 45) + 5,
  );
  const isBookmarked = usePostInteractions(s => Boolean(s.bookmarkedPosts[post.id]));
  const toggleLike = usePostInteractions(s => s.toggleLike);
  const toggleBookmark = usePostInteractions(s => s.toggleBookmark);

  const avatarBg = AVATAR_COLORS[(post.userId - 1) % AVATAR_COLORS.length] ?? '#2563EB';
  const readMinutes = Math.max(1, Math.round(post.body.split(/\s+/).length / 20));

  const handleLike = useCallback(() => {
    toggleLike(post.id);
  }, [post.id, toggleLike]);

  const handleBookmark = useCallback(() => {
    const saved = toggleBookmark(post.id);
    if (saved) {
      toast.success(t('posts.bookmarkAdded'));
    } else {
      toast.info(t('posts.bookmarkRemoved'));
    }
  }, [post.id, toggleBookmark, t]);

  return (
    <Pressable
      testID={`post-card-${post.id}`}
      accessibilityRole="button"
      accessibilityLabel={`Post #${post.id}: ${post.title}`}
      accessibilityHint="Navigates to post details"
      onPress={() => onPress(post.id)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {/* Top author & metadata row */}
      <View style={styles.topRow}>
        <View style={styles.authorGroup}>
          <View style={[styles.avatarCircle, { backgroundColor: avatarBg }]}>
            <Text variant="caption" color="textInverse" style={styles.avatarText}>
              U{post.userId}
            </Text>
          </View>
          <View>
            <Text variant="label" style={styles.authorName}>
              {t('posts.filterUser', { id: post.userId })}
            </Text>
            <Text variant="caption" color="textMuted">
              {t('posts.readTime', { minutes: readMinutes })} · #{post.id}
            </Text>
          </View>
        </View>

        {/* Bookmark quick-action button */}
        <Pressable
          hitSlop={10}
          onPress={handleBookmark}
          accessibilityRole="button"
          accessibilityLabel={isBookmarked ? t('posts.bookmarked') : t('posts.bookmark')}
          style={({ pressed }) => [
            styles.iconButton,
            isBookmarked && styles.bookmarkActive,
            pressed && styles.iconButtonPressed,
          ]}
        >
          <Text style={isBookmarked ? styles.bookmarkActiveText : styles.bookmarkInactiveText}>
            {isBookmarked ? '★' : '☆'}
          </Text>
        </Pressable>
      </View>

      {/* Post Title */}
      <Text variant="title2" numberOfLines={2} ellipsizeMode="tail" style={styles.title}>
        {post.title}
      </Text>

      {/* Body Preview */}
      <Text
        variant="callout"
        color="textSecondary"
        numberOfLines={2}
        ellipsizeMode="tail"
        style={styles.body}
      >
        {post.body.replace(/\n/g, ' ')}
      </Text>

      {/* Bottom interactive action bar */}
      <View style={styles.footerRow}>
        <View style={styles.interactionsRow}>
          {/* Like button */}
          <Pressable
            hitSlop={8}
            onPress={handleLike}
            accessibilityRole="button"
            accessibilityLabel={isLiked ? t('posts.liked') : t('posts.like')}
            style={({ pressed }) => [
              styles.actionPill,
              isLiked && styles.likedPill,
              pressed && styles.actionPillPressed,
            ]}
          >
            <Text style={isLiked ? styles.heartActive : styles.heartInactive}>
              {isLiked ? '♥' : '♡'}
            </Text>
            <Text
              variant="caption"
              style={isLiked ? styles.likeCountActive : styles.likeCountInactive}
            >
              {likeCount}
            </Text>
          </Pressable>

          {/* Comments indicator */}
          <View style={styles.commentPill}>
            <Text style={styles.commentIcon}>💬</Text>
            <Text variant="caption" color="textMuted">
              5
            </Text>
          </View>
        </View>

        {/* Read More button */}
        <View style={styles.readMoreGroup}>
          <Text variant="caption" color="primary" style={styles.readMoreText}>
            {t('posts.readMore')}
          </Text>
          <Text color="primary" style={styles.readMoreArrow}>
            →
          </Text>
        </View>
      </View>
    </Pressable>
  );
});

const useStyles = makeStyles(({ colors, radius, spacing }) => ({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardPressed: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    transform: [{ scale: 0.99 }],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: '700',
  },
  authorName: {
    fontWeight: '600',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSunken,
  },
  bookmarkActive: {
    backgroundColor: colors.primarySubtle,
  },
  iconButtonPressed: {
    opacity: 0.7,
  },
  bookmarkActiveText: {
    fontSize: 18,
    color: '#D97706',
  },
  bookmarkInactiveText: {
    fontSize: 18,
    color: colors.textMuted,
  },
  title: {
    fontWeight: '700',
    textTransform: 'capitalize',
    lineHeight: 26,
  },
  body: {
    lineHeight: 22,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSunken,
  },
  interactionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSunken,
  },
  likedPill: {
    backgroundColor: '#FEE2E2',
  },
  actionPillPressed: {
    opacity: 0.7,
  },
  heartActive: {
    fontSize: 14,
    color: '#DC2626',
  },
  heartInactive: {
    fontSize: 14,
    color: colors.textMuted,
  },
  likeCountActive: {
    color: '#DC2626',
    fontWeight: '600',
  },
  likeCountInactive: {
    color: colors.textMuted,
  },
  commentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSunken,
  },
  commentIcon: {
    fontSize: 12,
  },
  readMoreGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  readMoreText: {
    fontWeight: '600',
  },
  readMoreArrow: {
    fontSize: 14,
    fontWeight: '700',
  },
}));

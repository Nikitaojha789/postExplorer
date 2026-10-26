import { create } from 'zustand';

import type { Comment } from '../api/postsApi';

export interface PostInteractionsState {
  likedPosts: Record<number, boolean>;
  likeCounts: Record<number, number>;
  bookmarkedPosts: Record<number, boolean>;
  userComments: Record<number, Comment[]>;
  toggleLike: (postId: number) => boolean;
  toggleBookmark: (postId: number) => boolean;
  addComment: (postId: number, comment: Omit<Comment, 'id' | 'postId'>) => void;
}

const DEFAULT_BASE_LIKES = (id: number) => ((id * 7 + 13) % 45) + 5;

export const usePostInteractions = create<PostInteractionsState>()((set, get) => ({
  likedPosts: {},
  likeCounts: {},
  bookmarkedPosts: {},
  userComments: {},

  toggleLike: (postId: number) => {
    const isCurrentlyLiked = Boolean(get().likedPosts[postId]);
    const currentCount = get().likeCounts[postId] ?? DEFAULT_BASE_LIKES(postId);
    const newLiked = !isCurrentlyLiked;
    const newCount = newLiked ? currentCount + 1 : Math.max(0, currentCount - 1);

    set(state => ({
      likedPosts: { ...state.likedPosts, [postId]: newLiked },
      likeCounts: { ...state.likeCounts, [postId]: newCount },
    }));

    return newLiked;
  },

  toggleBookmark: (postId: number) => {
    const isCurrentlyBookmarked = Boolean(get().bookmarkedPosts[postId]);
    const newBookmarked = !isCurrentlyBookmarked;

    set(state => ({
      bookmarkedPosts: { ...state.bookmarkedPosts, [postId]: newBookmarked },
    }));

    return newBookmarked;
  },

  addComment: (postId: number, commentData: Omit<Comment, 'id' | 'postId'>) => {
    const newComment: Comment = {
      postId,
      id: Date.now(),
      ...commentData,
    };

    set(state => ({
      userComments: {
        ...state.userComments,
        [postId]: [newComment, ...(state.userComments[postId] ?? [])],
      },
    }));
  },
}));

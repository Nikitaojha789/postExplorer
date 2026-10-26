import { useQuery, useQueryClient } from '@tanstack/react-query';

import { postsApi, type Comment, type Post } from '../api/postsApi';
import { postsKeys } from '../api/postsKeys';

const STALE_TIME_MS = 2 * 60 * 1000; // 2 minutes

export const usePosts = () =>
  useQuery({
    queryKey: postsKeys.list(),
    queryFn: ({ signal }) => postsApi.getPosts(signal),
    staleTime: STALE_TIME_MS,
  });

export const usePost = (id: number | string, options?: { enabled?: boolean }) => {
  const queryClient = useQueryClient();
  const numericId = Number(id);

  return useQuery<Post>({
    queryKey: postsKeys.detail(id),
    queryFn: ({ signal }) => postsApi.getPost(id, signal),
    placeholderData: () =>
      queryClient.getQueryData<Post[]>(postsKeys.list())?.find(item => item.id === numericId),
    staleTime: STALE_TIME_MS,
    enabled: options?.enabled ?? true,
  });
};

export const usePostComments = (id: number | string, options?: { enabled?: boolean }) =>
  useQuery<Comment[]>({
    queryKey: postsKeys.comments(id),
    queryFn: ({ signal }) => postsApi.getComments(id, signal),
    staleTime: STALE_TIME_MS,
    enabled: options?.enabled ?? true,
  });

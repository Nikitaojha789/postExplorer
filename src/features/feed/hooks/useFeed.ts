import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';

import { feedApi, type FeedItem, type FeedPage } from '../api/feedApi';
import { feedKeys } from '../api/feedKeys';

// Module-level so its reference is stable: `select` only re-runs when data changes.
const flattenPages = (data: InfiniteData<FeedPage>): FeedItem[] =>
  data.pages.flatMap(page => page.items);

export const useFeed = () =>
  useInfiniteQuery({
    queryKey: feedKeys.list(),
    queryFn: ({ pageParam, signal }) => feedApi.getPage(pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: lastPage => lastPage.nextCursor,
    select: flattenPages,
    // Cap memory for long sessions: keep at most 10 pages in the cache.
    maxPages: 10,
    meta: { persist: true },
  });

export const useFeedItem = (id: string) => {
  const queryClient = useQueryClient();
  return useQuery<FeedItem>({
    queryKey: feedKeys.detail(id),
    queryFn: ({ signal }) => feedApi.getItem(id, signal),
    // Render instantly from the list cache when navigating from the feed.
    placeholderData: () =>
      queryClient
        .getQueryData<InfiniteData<FeedPage>>(feedKeys.list())
        ?.pages.flatMap(page => page.items)
        .find(item => item.id === id),
  });
};

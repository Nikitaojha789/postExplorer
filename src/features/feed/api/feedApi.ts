import { z } from 'zod';

import { http } from '@/core/api';

export const FeedItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  /** Small rendition for list rows — never load full images in lists. */
  thumbnailUrl: z.url(),
  imageUrl: z.url(),
  createdAt: z.iso.datetime(),
});
export type FeedItem = z.infer<typeof FeedItemSchema>;

export const FeedPageSchema = z.object({
  items: z.array(FeedItemSchema),
  nextCursor: z.string().nullable(),
});
export type FeedPage = z.infer<typeof FeedPageSchema>;

export const FEED_PAGE_SIZE = 20;

export const feedApi = {
  getPage: (cursor: string | null, signal?: AbortSignal) =>
    http.get('/items', {
      query: { cursor, limit: FEED_PAGE_SIZE },
      schema: FeedPageSchema,
      signal,
    }),
  getItem: (id: string, signal?: AbortSignal) =>
    http.get(`/items/${encodeURIComponent(id)}`, { schema: FeedItemSchema, signal }),
} as const;

import { registerMockRoute } from '@/core/api/mock';

import type { FeedItem } from './api/feedApi';

const TOTAL_ITEMS = 500;
const BASE_TIME = Date.UTC(2026, 0, 1);

const makeItem = (index: number): FeedItem => ({
  id: String(index + 1),
  title: `Item ${index + 1}`,
  summary: 'Example content served by the in-app mock API. Replace with your backend.',
  thumbnailUrl: `https://picsum.photos/seed/baseline-${index + 1}/112`,
  imageUrl: `https://picsum.photos/seed/baseline-${index + 1}/1080/720`,
  createdAt: new Date(BASE_TIME - index * 3_600_000).toISOString(),
});

/** Dev-only mock backend for this feature. Registered from app/bootstrap/mocks.ts. */
export const registerFeedMocks = (): void => {
  registerMockRoute('GET', '/items', ({ query }) => {
    const start = Number(query.get('cursor') ?? 0);
    const limit = Number(query.get('limit') ?? 20);
    const end = Math.min(start + limit, TOTAL_ITEMS);
    return {
      body: {
        items: Array.from({ length: end - start }, (_, i) => makeItem(start + i)),
        nextCursor: end < TOTAL_ITEMS ? String(end) : null,
      },
    };
  });

  registerMockRoute('GET', '/items/:id', ({ params }) => {
    const index = Number(params.id) - 1;
    return index >= 0 && index < TOTAL_ITEMS
      ? { body: makeItem(index) }
      : { status: 404, body: { message: 'Item not found' } };
  });
};

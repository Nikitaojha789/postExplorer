import { QueryClientProvider } from '@tanstack/react-query';
import { screen } from '@testing-library/react-native';
import { measureRenders } from 'reassure';

import { createTestQueryClient } from '@test/render';

import { FeedScreen } from './FeedScreen';
import { feedApi, type FeedItem } from '../api/feedApi';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual<object>('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn() }),
  useFocusEffect: jest.fn(),
}));
jest.mock('../api/feedApi', () => ({
  ...jest.requireActual<object>('../api/feedApi'),
  feedApi: { getPage: jest.fn(), getItem: jest.fn() },
}));

const items: FeedItem[] = Array.from({ length: 50 }, (_, i) => ({
  id: String(i + 1),
  title: `Item ${i + 1}`,
  summary: 'Summary',
  thumbnailUrl: `https://img.test/${i + 1}-thumb.png`,
  imageUrl: `https://img.test/${i + 1}.png`,
  createdAt: '2026-01-01T00:00:00.000Z',
}));

/**
 * Render-count/duration regression guard (Reassure). CI compares this branch
 * against the cached `main` baseline and flags statistically significant
 * regressions. Run locally: `npm run test:perf`.
 */
test('FeedScreen: initial load renders', async () => {
  jest.mocked(feedApi.getPage).mockResolvedValue({ items, nextCursor: null });

  await measureRenders(
    <QueryClientProvider client={createTestQueryClient()}>
      <FeedScreen />
    </QueryClientProvider>,
    {
      scenario: async () => {
        await screen.findByText('Item 1');
      },
    },
  );
});

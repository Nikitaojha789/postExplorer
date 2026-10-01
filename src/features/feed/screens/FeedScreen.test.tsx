import { act, screen, userEvent } from '@testing-library/react-native';

import { AppError } from '@/core/errors';
import { renderWithProviders } from '@test/render';

import { FeedScreen } from './FeedScreen';
import { feedApi, type FeedItem } from '../api/feedApi';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual<object>('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
  useFocusEffect: jest.fn(),
}));
jest.mock('../api/feedApi', () => ({
  ...jest.requireActual<object>('../api/feedApi'),
  feedApi: { getPage: jest.fn(), getItem: jest.fn() },
}));
const getPage = jest.mocked(feedApi.getPage);

const item = (id: number): FeedItem => ({
  id: String(id),
  title: `Item ${id}`,
  summary: 'Summary',
  thumbnailUrl: `https://img.test/${id}-thumb.png`,
  imageUrl: `https://img.test/${id}.png`,
  createdAt: '2026-01-01T00:00:00.000Z',
});

describe('FeedScreen', () => {
  beforeEach(() => {
    getPage.mockReset();
    mockNavigate.mockReset();
  });

  // FlashList schedules a layout pass after first paint; let it settle inside
  // act() before the automatic unmount, so it doesn't warn after the test.
  afterEach(async () => {
    await act(() => new Promise<void>(resolve => setImmediate(resolve)));
  });

  it('renders items and opens the detail screen on press', async () => {
    getPage.mockResolvedValue({ items: [item(1), item(2)], nextCursor: null });
    const user = userEvent.setup();
    await renderWithProviders(<FeedScreen />);

    expect(await screen.findByText('Item 1')).toBeOnTheScreen();
    await user.press(screen.getByTestId('feed-item-2'));
    expect(mockNavigate).toHaveBeenCalledWith('FeedItem', { id: '2' });
  });

  it('shows the empty state', async () => {
    getPage.mockResolvedValue({ items: [], nextCursor: null });
    await renderWithProviders(<FeedScreen />);
    expect(await screen.findByText('Nothing here yet')).toBeOnTheScreen();
  });

  it('shows a translated error with retry when nothing is cached', async () => {
    getPage.mockRejectedValueOnce(new AppError({ kind: 'network', message: 'down' }));
    getPage.mockResolvedValueOnce({ items: [item(1)], nextCursor: null });
    const user = userEvent.setup();
    await renderWithProviders(<FeedScreen />);

    expect(
      await screen.findByText("Can't reach the server. Check your connection."),
    ).toBeOnTheScreen();
    await user.press(screen.getByText('Try again'));
    expect(await screen.findByText('Item 1')).toBeOnTheScreen();
  });
});

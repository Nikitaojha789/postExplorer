import { act, screen, userEvent } from '@testing-library/react-native';

import { AppError } from '@/core/errors';
import { renderWithProviders } from '@test/render';

import { PostListScreen } from './PostListScreen';
import { postsApi, type Post } from '../api/postsApi';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual<object>('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
  useFocusEffect: jest.fn(),
}));

jest.mock('../api/postsApi', () => ({
  ...jest.requireActual<object>('../api/postsApi'),
  postsApi: { getPosts: jest.fn(), getPost: jest.fn() },
}));
const getPosts = jest.mocked(postsApi.getPosts);

const samplePost = (id: number): Post => ({
  id,
  userId: Math.floor(id / 5) + 1,
  title: `Sample Post Title ${id}`,
  body: `This is the body content for sample post ${id}.`,
});

describe('PostListScreen', () => {
  beforeEach(() => {
    getPosts.mockReset();
    mockNavigate.mockReset();
  });

  afterEach(async () => {
    await act(() => new Promise<void>(resolve => setImmediate(resolve)));
  });

  it('renders posts and navigates to the detail screen on press', async () => {
    getPosts.mockResolvedValue([samplePost(1), samplePost(2)]);
    const user = userEvent.setup();
    await renderWithProviders(<PostListScreen />);

    expect(await screen.findByText('Sample Post Title 1')).toBeOnTheScreen();
    expect(screen.getByText('Sample Post Title 2')).toBeOnTheScreen();

    await user.press(screen.getByTestId('post-card-2'));
    expect(mockNavigate).toHaveBeenCalledWith('PostDetail', { id: 2 });
  });

  it('shows the empty state when no posts are returned', async () => {
    getPosts.mockResolvedValue([]);
    await renderWithProviders(<PostListScreen />);

    expect(await screen.findByText('No posts found')).toBeOnTheScreen();
    expect(screen.getByText('There are no posts available at this time.')).toBeOnTheScreen();
  });

  it('shows an error state with retry button when fetch fails and retries successfully', async () => {
    getPosts.mockRejectedValueOnce(new AppError({ kind: 'network', message: 'Network offline' }));
    getPosts.mockResolvedValueOnce([samplePost(1)]);
    const user = userEvent.setup();
    await renderWithProviders(<PostListScreen />);

    expect(
      await screen.findByText("Can't reach the server. Check your connection."),
    ).toBeOnTheScreen();

    await user.press(screen.getByText('Try again'));
    expect(await screen.findByText('Sample Post Title 1')).toBeOnTheScreen();
  });
});

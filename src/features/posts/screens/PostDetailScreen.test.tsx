import { screen, userEvent } from '@testing-library/react-native';

import { AppError } from '@/core/errors';
import { renderWithProviders } from '@test/render';

import { PostDetailScreen } from './PostDetailScreen';
import { postsApi, type Post } from '../api/postsApi';

jest.mock('../api/postsApi', () => ({
  ...jest.requireActual<object>('../api/postsApi'),
  postsApi: { getPosts: jest.fn(), getPost: jest.fn() },
}));
const getPost = jest.mocked(postsApi.getPost);

const samplePost: Post = {
  id: 1,
  userId: 4,
  title: 'Detailed Sample Post Title',
  body: 'This is the complete and uncut body of the post for detail view testing.',
};

describe('PostDetailScreen', () => {
  beforeEach(() => {
    getPost.mockReset();
  });

  it('renders post details including full title, body, post ID, and user ID', async () => {
    getPost.mockResolvedValue(samplePost);

    await renderWithProviders(<PostDetailScreen route={{ params: { id: 1 } }} />);

    expect(await screen.findByText('Detailed Sample Post Title')).toBeOnTheScreen();
    expect(
      screen.getByText('This is the complete and uncut body of the post for detail view testing.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Post #1')).toBeOnTheScreen();
    expect(screen.getByText('User #4')).toBeOnTheScreen();
  });

  it('shows an error state for invalid post IDs without calling the API', async () => {
    await renderWithProviders(<PostDetailScreen route={{ params: { id: -5 } }} />);

    expect(await screen.findByText('Invalid post ID')).toBeOnTheScreen();
    expect(getPost).not.toHaveBeenCalled();
  });

  it('shows error state with retry when fetching fails and recovers on retry', async () => {
    getPost.mockRejectedValueOnce(new AppError({ kind: 'network', message: 'Offline' }));
    getPost.mockResolvedValueOnce(samplePost);
    const user = userEvent.setup();

    await renderWithProviders(<PostDetailScreen route={{ params: { id: 1 } }} />);

    expect(
      await screen.findByText("Can't reach the server. Check your connection."),
    ).toBeOnTheScreen();

    await user.press(screen.getByText('Try again'));
    expect(await screen.findByText('Detailed Sample Post Title')).toBeOnTheScreen();
  });
});

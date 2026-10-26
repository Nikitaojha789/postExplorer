import { http } from '@/core/api';

import { postsApi, PostListSchema, PostSchema } from './postsApi';

jest.mock('@/core/api', () => ({
  ...jest.requireActual<object>('@/core/api'),
  http: {
    get: jest.fn(),
  },
}));
const httpGet = jest.mocked(http.get);

describe('postsApi', () => {
  beforeEach(() => {
    httpGet.mockReset();
  });

  it('validates a single post against PostSchema', () => {
    const rawPost = {
      userId: 1,
      id: 1,
      title: 'Title',
      body: 'Body content',
    };
    const parsed = PostSchema.parse(rawPost);
    expect(parsed).toEqual(rawPost);
  });

  it('validates a list of posts against PostListSchema', () => {
    const rawList = [
      { userId: 1, id: 1, title: 'Title 1', body: 'Body 1' },
      { userId: 2, id: 2, title: 'Title 2', body: 'Body 2' },
    ];
    const parsed = PostListSchema.parse(rawList);
    expect(parsed).toHaveLength(2);
  });

  it('calls http.get with correct path and schema for getPosts', async () => {
    httpGet.mockResolvedValueOnce([]);
    const controller = new AbortController();

    await postsApi.getPosts(controller.signal);

    expect(httpGet).toHaveBeenCalledWith('/posts', {
      schema: PostListSchema,
      signal: controller.signal,
      auth: false,
    });
  });

  it('calls http.get with encoded ID and schema for getPost', async () => {
    const mockPost = { userId: 1, id: 42, title: 'Test', body: 'Test body' };
    httpGet.mockResolvedValueOnce(mockPost);

    const result = await postsApi.getPost(42);

    expect(httpGet).toHaveBeenCalledWith('/posts/42', {
      schema: PostSchema,
      signal: undefined,
      auth: false,
    });
    expect(result).toEqual(mockPost);
  });
});

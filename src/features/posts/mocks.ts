import { registerMockRoute } from '@/core/api/mock';

import type { Post } from './api/postsApi';

const MOCK_POSTS: Post[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  userId: Math.floor(i / 5) + 1,
  title: `Sample Post Title ${i + 1}`,
  body: `This is a sample post body for post ${i + 1}. Demonstrating mock response handling for offline testing.`,
}));

/** Dev-only mock backend for posts. Registered from app/bootstrap/mocks.ts. */
export const registerPostsMocks = (): void => {
  registerMockRoute('GET', '/posts', () => ({
    body: MOCK_POSTS,
  }));

  registerMockRoute('GET', '/posts/:id', ({ params }) => {
    const post = MOCK_POSTS.find(p => p.id === Number(params.id));
    return post ? { body: post } : { status: 404, body: { message: 'Post not found' } };
  });
};

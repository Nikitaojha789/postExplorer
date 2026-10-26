import { z } from 'zod';

import { http } from '@/core/api';

export const PostSchema = z.object({
  userId: z.number(),
  id: z.number(),
  title: z.string(),
  body: z.string(),
});
export type Post = z.infer<typeof PostSchema>;

export const PostListSchema = z.array(PostSchema);

export const CommentSchema = z.object({
  postId: z.number(),
  id: z.number(),
  name: z.string(),
  email: z.string(),
  body: z.string(),
});
export type Comment = z.infer<typeof CommentSchema>;

export const CommentListSchema = z.array(CommentSchema);

export const postsApi = {
  getPosts: (signal?: AbortSignal) =>
    http.get('/posts', {
      schema: PostListSchema,
      signal,
      auth: false,
    }),
  getPost: (id: number | string, signal?: AbortSignal) =>
    http.get(`/posts/${encodeURIComponent(id)}`, {
      schema: PostSchema,
      signal,
      auth: false,
    }),
  getComments: (postId: number | string, signal?: AbortSignal) =>
    http.get(`/posts/${encodeURIComponent(postId)}/comments`, {
      schema: CommentListSchema,
      signal,
      auth: false,
    }),
} as const;

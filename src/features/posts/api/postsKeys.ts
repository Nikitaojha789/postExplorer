export const postsKeys = {
  all: ['posts'] as const,
  list: () => [...postsKeys.all, 'list'] as const,
  detail: (id: number | string) => [...postsKeys.all, 'detail', String(id)] as const,
  comments: (id: number | string) => [...postsKeys.all, 'comments', String(id)] as const,
};

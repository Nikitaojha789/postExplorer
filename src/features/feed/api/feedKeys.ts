/**
 * Query-key factory: the ONLY place keys for this feature are built, so
 * invalidation (`queryClient.invalidateQueries({ queryKey: feedKeys.all })`)
 * can never drift from the keys used to fetch.
 */
export const feedKeys = {
  all: ['feed'] as const,
  list: () => [...feedKeys.all, 'list'] as const,
  detail: (id: string) => [...feedKeys.all, 'detail', id] as const,
};

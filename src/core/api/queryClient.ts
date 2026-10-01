import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { toAppError } from '@/core/errors';
import { reportError } from '@/core/monitoring';

const MINUTE = 60_000;
const MAX_RETRIES = 2;

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: {
      /** Opt-in: persist this query to disk for offline/instant start. */
      persist?: boolean;
    };
  }
}

const onError = (error: unknown) => {
  const appError = toAppError(error);
  if (appError.isReportable) reportError(appError);
};

/**
 * Defaults tuned for mobile:
 * - `staleTime` 30s avoids refetch storms when navigating back and forth.
 * - Only transient failures retry (network/5xx/429), with capped backoff;
 *   a 4xx will not succeed on retry and wastes battery.
 * - Mutations never auto-retry (not guaranteed idempotent).
 */
export const createQueryClient = () =>
  new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 24 * 60 * MINUTE,
        retry: (failureCount, error) => failureCount < MAX_RETRIES && toAppError(error).isRetryable,
        retryDelay: attempt => Math.min(1_000 * 2 ** attempt, 8_000),
      },
      mutations: { retry: false },
    },
  });

export const queryClient = createQueryClient();

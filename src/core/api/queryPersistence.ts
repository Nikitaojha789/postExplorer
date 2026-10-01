import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client';

import { buildInfo } from '@/core/config';
import { StorageKeys, toStorageAdapter, userStorage } from '@/core/storage';

const MAX_AGE_MS = 24 * 60 * 60_000;

/**
 * Bump whenever the SHAPE of any persisted query changes. Rehydrated data is
 * not re-validated, so a stale shape would reach components unchecked.
 */
const CACHE_SCHEMA_VERSION = 2;

/**
 * Persists ONLY queries that opt in via `meta: { persist: true }` — the cache
 * is stored unencrypted, so sensitive data must never be marked persistent.
 * The cache is busted on every app version and schema version.
 */
export const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister: createAsyncStoragePersister({
    storage: toStorageAdapter(userStorage),
    key: StorageKeys.queryCache,
    throttleTime: 1_000,
  }),
  maxAge: MAX_AGE_MS,
  buster: `${buildInfo.version}-${CACHE_SCHEMA_VERSION}`,
  dehydrateOptions: {
    shouldDehydrateQuery: query => query.state.status === 'success' && query.meta?.persist === true,
  },
};

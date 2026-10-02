import type { z } from 'zod';
import { createJSONStorage, type PersistOptions } from 'zustand/middleware';

import { logger } from '@/core/logger';

import { toStorageAdapter } from './adapters';
import type { StorageKey } from './keys';
import type { KeyValueStore } from './keyValueStore';

interface ValidatedPersistConfig<TState, TPersisted> {
  key: StorageKey;
  /** `userStorage` for anything user-scoped (wiped on sign-out), else `appStorage`. */
  store: KeyValueStore;
  /** Validates rehydrated data — storage is untrusted (older app versions, corruption). */
  schema: z.ZodType<TPersisted>;
  /** Persist data only — never actions or derived values. */
  partialize: (state: TState) => TPersisted;
  /** Bump when the persisted shape changes. */
  version?: number;
  /**
   * Upgrades data written by an older `version`. Without it, data from
   * another version is discarded and the store starts from its initial state.
   */
  migrate?: (persisted: unknown, fromVersion: number) => unknown;
}

/**
 * Options for Zustand's `persist` middleware on top of MMKV:
 *
 *   create<State>()(persist(initializer, validatedPersistOptions({ … })))
 *
 * MMKV is synchronous, so the store hydrates during `create()` — the first
 * render already sees persisted state (no empty flash, no `hasHydrated`).
 * Stores in `userStorage` must also reset in `onSessionEnded` (core/auth).
 */
export const validatedPersistOptions = <TState, TPersisted>({
  key,
  store,
  schema,
  partialize,
  version = 1,
  migrate,
}: ValidatedPersistConfig<TState, TPersisted>): PersistOptions<TState, TPersisted> => ({
  name: key,
  version,
  storage: createJSONStorage<TPersisted>(() => toStorageAdapter(store)),
  partialize,
  // Zustand calls this only when the stored version differs. The result is
  // still validated by `merge`; `undefined` means "start fresh".
  migrate: (persisted, fromVersion) => {
    if (migrate) return migrate(persisted, fromVersion) as TPersisted;
    logger.warn('Persisted store version changed; starting fresh', { key, fromVersion, version });
    return undefined as TPersisted;
  },
  merge: (persisted, current) => {
    if (persisted === undefined) return current;
    const parsed = schema.safeParse(persisted);
    if (parsed.success) return { ...current, ...parsed.data };
    logger.warn('Persisted store failed validation; starting fresh', { key });
    return current;
  },
});

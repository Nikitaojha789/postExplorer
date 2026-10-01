import type { KeyValueStore } from './keyValueStore';

/**
 * Adapter with the `getItem/setItem/removeItem` shape expected by Zustand's
 * `createJSONStorage` and TanStack Query's `createAsyncStoragePersister`
 * (both accept synchronous return values).
 */
export const toStorageAdapter = (store: KeyValueStore) => ({
  getItem: (key: string): string | null => store.getString(key) ?? null,
  setItem: (key: string, value: string): void => store.setString(key, value),
  removeItem: (key: string): void => store.remove(key),
});

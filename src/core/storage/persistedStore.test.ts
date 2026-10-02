import { z } from 'zod';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { StorageKeys } from './keys';
import { userStorage } from './keyValueStore';
import { validatedPersistOptions } from './persistedStore';

// Any key works for the test; real stores add their own to StorageKeys.
const KEY = StorageKeys.sessionUser;
const Schema = z.object({ items: z.array(z.number()) });
type State = z.infer<typeof Schema> & { transient: string };

const makeStore = (options?: {
  version?: number;
  migrate?: (persisted: unknown, fromVersion: number) => unknown;
}) =>
  create<State>()(
    persist(
      (): State => ({ items: [], transient: 'fresh' }),
      validatedPersistOptions({
        key: KEY,
        store: userStorage,
        schema: Schema,
        partialize: state => ({ items: state.items }),
        ...options,
      }),
    ),
  );

const writeRaw = (state: unknown, version: number) =>
  userStorage.setString(KEY, JSON.stringify({ state, version }));

beforeEach(() => userStorage.clearAll());

describe('validatedPersistOptions', () => {
  it('hydrates synchronously from storage on create', () => {
    writeRaw({ items: [1, 2] }, 1);
    expect(makeStore().getState().items).toEqual([1, 2]);
  });

  it('persists only the partialized data', () => {
    const store = makeStore();
    store.setState({ items: [7], transient: 'changed' });
    const raw = userStorage.getString(KEY) ?? '';
    expect(raw).toContain('[7]');
    expect(raw).not.toContain('transient');
  });

  it('discards persisted data that fails validation', () => {
    writeRaw({ items: ['not-a-number'] }, 1);
    expect(makeStore().getState()).toEqual({ items: [], transient: 'fresh' });
  });

  it('discards data from another version when there is no migration', () => {
    writeRaw({ items: [1] }, 1);
    expect(makeStore({ version: 2 }).getState().items).toEqual([]);
  });

  it('migrates data from an older version, then validates it', () => {
    writeRaw({ ids: [3, 4] }, 1);
    const store = makeStore({
      version: 2,
      migrate: (persisted, fromVersion) =>
        fromVersion === 1 ? { items: (persisted as { ids: number[] }).ids } : persisted,
    });
    expect(store.getState().items).toEqual([3, 4]);
  });
});

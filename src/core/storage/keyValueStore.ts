import { createMMKV, type MMKV } from 'react-native-mmkv';
import type { z } from 'zod';

import { logger } from '@/core/logger';

/**
 * Synchronous key-value storage (MMKV, JSI — no bridge round-trip).
 *
 * Use for preferences, small caches and non-sensitive state. NOT for tokens,
 * passwords or PII: MMKV files are protected by the OS sandbox but are not
 * encrypted by default. Secrets belong in `secureStorage`.
 */
export interface KeyValueStore {
  getString(key: string): string | undefined;
  setString(key: string, value: string): void;
  getBoolean(key: string): boolean | undefined;
  setBoolean(key: string, value: boolean): void;
  getNumber(key: string): number | undefined;
  setNumber(key: string, value: number): void;
  /** Reads JSON and validates it; returns `undefined` on absent/corrupt data. */
  getObject<T>(key: string, schema: z.ZodType<T>): T | undefined;
  setObject(key: string, value: unknown): void;
  remove(key: string): void;
  contains(key: string): boolean;
  clearAll(): void;
}

const wrap = (mmkv: MMKV): KeyValueStore => ({
  getString: key => mmkv.getString(key),
  setString: (key, value) => mmkv.set(key, value),
  getBoolean: key => mmkv.getBoolean(key),
  setBoolean: (key, value) => mmkv.set(key, value),
  getNumber: key => mmkv.getNumber(key),
  setNumber: (key, value) => mmkv.set(key, value),
  getObject(key, schema) {
    const raw = mmkv.getString(key);
    if (raw === undefined) return undefined;
    try {
      const parsed = schema.safeParse(JSON.parse(raw));
      if (parsed.success) return parsed.data;
      logger.warn('Stored value failed validation; discarding', { key });
    } catch {
      logger.warn('Stored value is not valid JSON; discarding', { key });
    }
    mmkv.remove(key);
    return undefined;
  },
  setObject: (key, value) => mmkv.set(key, JSON.stringify(value)),
  remove: key => {
    mmkv.remove(key);
  },
  contains: key => mmkv.contains(key),
  clearAll: () => mmkv.clearAll(),
});

/**
 * App-wide store: survives sign-out (theme, language, onboarding flags).
 */
export const appStorage: KeyValueStore = wrap(createMMKV({ id: 'app' }));

/**
 * User-scoped store: wiped on sign-out (query cache, user-scoped prefs).
 */
export const userStorage: KeyValueStore = wrap(createMMKV({ id: 'user' }));

import * as Keychain from 'react-native-keychain';

import { logger } from '@/core/logger';

/**
 * Hardware-backed secret storage (iOS Keychain / Android Keystore).
 *
 * - `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`: readable by background tasks after
 *   the first unlock, and never migrated to another device via backups.
 * - Each key is its own keychain "service" so items can be cleared
 *   independently.
 *
 * Calls cross into native code and may take a few ms (Keystore crypto) —
 * read once at startup and keep the value in memory, don't read per request.
 */
const SERVICE_PREFIX = 'baseline.secure.';

const options = (key: string) => ({
  service: `${SERVICE_PREFIX}${key}`,
  accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
});

export const secureStorage = {
  async get(key: string): Promise<string | null> {
    try {
      const result = await Keychain.getGenericPassword(options(key));
      return result ? result.password : null;
    } catch (error) {
      // Keystore entries can become unreadable (e.g. after the user changes
      // the device lock). Treat as absent rather than crashing the session.
      logger.warn('secureStorage.get failed', { key, error });
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    const result = await Keychain.setGenericPassword(key, value, options(key));
    if (result === false) {
      throw new Error(`secureStorage.set failed for "${key}"`);
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await Keychain.resetGenericPassword(options(key));
    } catch (error) {
      logger.warn('secureStorage.remove failed', { key, error });
    }
  },
} as const;

import { logger } from '@/core/logger';
import { registerAuthMocks } from '@/features/auth/mocks';
import { registerFeedMocks } from '@/features/feed/mocks';

/** Dev-only. Every feature with a mock backend registers it here. */
export const registerDevMocks = (): void => {
  registerAuthMocks();
  registerFeedMocks();
  logger.info('Mock API enabled');
};

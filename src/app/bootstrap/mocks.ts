import { logger } from '@/core/logger';
import { registerAuthMocks } from '@/features/auth/mocks';
import { registerFeedMocks } from '@/features/feed/mocks';
import { registerPostsMocks } from '@/features/posts/mocks';

/** Dev-only. Every feature with a mock backend registers it here. */
export const registerDevMocks = (): void => {
  registerAuthMocks();
  registerFeedMocks();
  registerPostsMocks();
  logger.info('Mock API enabled');
};

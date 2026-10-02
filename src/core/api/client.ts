import { buildInfo, env } from '@/core/config';
import { i18n } from '@/core/i18n';

import { createHttpClient } from './httpClient';
import { withNetworkConditions } from './networkConditions';

// `__DEV__` is a compile-time constant: in release builds this branch — and
// the lazily required mock server — is removed from the bundle entirely.
const transport: typeof fetch =
  __DEV__ && env.USE_MOCK_API
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      (require('./mock/mockServer') as { mockFetch: typeof fetch }).mockFetch
    : // Resolved per call, so tooling and tests that replace `fetch` still apply.
      (input, init) => fetch(input, init);

/**
 * The app's single HTTP client. Feature `api/` modules call this; screens and
 * hooks never call `fetch` directly.
 */
export const http = createHttpClient({
  baseUrl: env.API_URL,
  timeoutMs: env.API_TIMEOUT_MS,
  getDefaultHeaders: () => ({
    'Accept-Language': i18n.language,
    'X-App-Version': buildInfo.version,
    'X-App-Build': buildInfo.buildNumber,
    'X-Platform': buildInfo.platform,
  }),
  // Dev builds can simulate latency, failures and offline (Dev Menu).
  fetchImpl: __DEV__ ? withNetworkConditions(transport) : transport,
});

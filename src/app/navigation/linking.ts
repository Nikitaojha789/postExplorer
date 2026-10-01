import { env } from '@/core/config';

/**
 * Deep-link prefixes per environment (`.env.*` → DEEP_LINK_SCHEME/HOST).
 * Paths come from the `linking` fields in RootNavigator. Treat every param
 * as untrusted input: screens validate before use, and auth-gated screens
 * are unreachable while signed out (the `if:` groups handle that).
 */
export const linkingPrefixes: string[] = [
  `${env.DEEP_LINK_SCHEME}://`,
  ...(env.DEEP_LINK_HOST ? [`https://${env.DEEP_LINK_HOST}`] : []),
];

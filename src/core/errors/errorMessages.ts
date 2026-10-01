import type { AppErrorKind } from './AppError';
import { toAppError } from './AppError';

/**
 * Maps an error to a user-facing i18n key. Server messages are NOT shown
 * verbatim by default — they're often technical, untranslated, or leak
 * internals. Opt in per call site with `preferServerMessage`.
 */
const KEY_BY_KIND = {
  offline: 'errors.offline',
  timeout: 'errors.timeout',
  cancelled: 'errors.generic',
  network: 'errors.network',
  unauthorized: 'errors.unauthorized',
  forbidden: 'errors.forbidden',
  not_found: 'errors.notFound',
  conflict: 'errors.generic',
  validation: 'errors.generic',
  rate_limited: 'errors.rateLimited',
  server: 'errors.server',
  parse: 'errors.generic',
  unknown: 'errors.generic',
} as const satisfies Record<AppErrorKind, `errors.${string}`>;

export const errorMessageKey = (error: unknown) => KEY_BY_KIND[toAppError(error).kind];

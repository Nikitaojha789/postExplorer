/**
 * The single error type that crosses layer boundaries.
 *
 * Every failure (network, HTTP, parsing, validation, unexpected throw) is
 * normalised into an `AppError` at the edge where it happens, so UI code can
 * switch on `kind` instead of sniffing status codes or message strings.
 */
export type AppErrorKind =
  | 'offline'
  | 'timeout'
  | 'cancelled'
  | 'network'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'validation'
  | 'rate_limited'
  | 'server'
  | 'parse'
  | 'unknown';

export interface AppErrorOptions {
  kind: AppErrorKind;
  message: string;
  status?: number;
  /** Machine-readable code from the backend, when provided. */
  code?: string;
  /** Field-level validation messages, keyed by field name. */
  fieldErrors?: Readonly<Record<string, string>>;
  cause?: unknown;
}

export class AppError extends Error {
  readonly kind: AppErrorKind;
  readonly status?: number;
  readonly code?: string;
  readonly fieldErrors?: Readonly<Record<string, string>>;

  constructor({ kind, message, status, code, fieldErrors, cause }: AppErrorOptions) {
    super(message, { cause });
    this.name = 'AppError';
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }

  /** Errors worth retrying automatically (transient by nature). */
  get isRetryable(): boolean {
    return (
      this.kind === 'network' ||
      this.kind === 'timeout' ||
      this.kind === 'rate_limited' ||
      (this.kind === 'server' && (this.status ?? 500) >= 500)
    );
  }

  /** Errors that indicate a bug or contract drift and should reach monitoring. */
  get isReportable(): boolean {
    return this.kind === 'parse' || this.kind === 'unknown' || this.kind === 'server';
  }
}

export const isAppError = (value: unknown): value is AppError => value instanceof AppError;

export const kindFromStatus = (status: number): AppErrorKind => {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 400 || status === 422) return 'validation';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'server';
  return 'unknown';
};

/** Normalise anything thrown into an `AppError` without losing the original. */
export const toAppError = (error: unknown): AppError => {
  if (isAppError(error)) return error;
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return new AppError({ kind: 'cancelled', message: 'Request was cancelled', cause: error });
    }
    if (error.name === 'TimeoutError') {
      return new AppError({ kind: 'timeout', message: 'Request timed out', cause: error });
    }
    // fetch rejects with a TypeError for DNS/TLS/connection failures.
    if (error instanceof TypeError && /network/i.test(error.message)) {
      return new AppError({ kind: 'network', message: error.message, cause: error });
    }
    return new AppError({ kind: 'unknown', message: error.message, cause: error });
  }
  return new AppError({ kind: 'unknown', message: String(error), cause: error });
};

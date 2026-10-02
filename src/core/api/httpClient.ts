import { z } from 'zod';

import { AppError, kindFromStatus, toAppError } from '@/core/errors';
import { logger } from '@/core/logger';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions<T> {
  query?: QueryParams;
  /** JSON-serialised unless it is FormData. */
  body?: unknown;
  headers?: Record<string, string>;
  /** Validates the response body. Strongly recommended for every endpoint. */
  schema?: z.ZodType<T>;
  /** Pass TanStack Query's `signal` so leaving a screen cancels the request. */
  signal?: AbortSignal;
  timeoutMs?: number;
  /** Attach the bearer token and handle 401 → refresh → retry. Default true. */
  auth?: boolean;
}

export interface AuthHandlers {
  getAccessToken: () => string | null;
  /** Returns a fresh access token, or null when the session is unrecoverable. */
  refreshAccessToken: () => Promise<string | null>;
  onSessionExpired: () => void;
}

export interface HttpClientConfig {
  baseUrl: string;
  timeoutMs: number;
  /** Headers sent with every request (locale, app version…). Called per request. */
  getDefaultHeaders?: () => Record<string, string>;
  /** Swap the transport — used for in-app mocks and tests. */
  fetchImpl?: typeof fetch;
}

interface ErrorBody {
  message?: string;
  code?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Extracts message/code/field errors from common error envelopes:
 * `{ message, code, errors: { field: ['msg'] | 'msg' } }`. Adapt to your API.
 */
const ErrorEnvelope = z
  .object({
    message: z.string().optional(),
    error: z.string().optional(),
    code: z.union([z.string(), z.number()]).optional(),
    errors: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional(),
  })
  .loose();

const parseErrorBody = (body: unknown): ErrorBody => {
  const parsed = ErrorEnvelope.safeParse(body);
  if (!parsed.success) return {};
  const { message, error, code, errors } = parsed.data;
  const fieldErrors = errors
    ? Object.fromEntries(
        Object.entries(errors).map(([field, value]) => [
          field,
          Array.isArray(value) ? (value[0] ?? '') : value,
        ]),
      )
    : undefined;
  return { message: message ?? error, code: code?.toString(), fieldErrors };
};

const buildUrl = (baseUrl: string, path: string, query?: QueryParams): string => {
  const url = path.startsWith('http')
    ? path
    : `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  if (!query) return url;
  const search = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  return search ? `${url}${url.includes('?') ? '&' : '?'}${search}` : url;
};

const readBody = async (response: Response): Promise<unknown> => {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    throw new AppError({
      kind: 'parse',
      status: response.status,
      message: 'Response body is not valid JSON',
    });
  }
};

let requestCounter = 0;
const nextRequestId = () => `${Date.now().toString(36)}-${(++requestCounter).toString(36)}`;

export const createHttpClient = (config: HttpClientConfig) => {
  let auth: AuthHandlers | null = null;
  // Single-flight refresh: concurrent 401s share one refresh call.
  let refreshInFlight: Promise<string | null> | null = null;

  const refreshOnce = (): Promise<string | null> => {
    if (!auth) return Promise.resolve(null);
    refreshInFlight ??= auth.refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
    return refreshInFlight;
  };

  const send = async (
    method: HttpMethod,
    path: string,
    options: RequestOptions<unknown>,
    token: string | null,
  ) => {
    const { body, headers, query, signal, timeoutMs = config.timeoutMs } = options;
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const fetchImpl = config.fetchImpl ?? fetch;

    try {
      return await fetchImpl(buildUrl(config.baseUrl, path, query), {
        method,
        headers: {
          Accept: 'application/json',
          ...(body !== undefined && !isFormData ? { 'Content-Type': 'application/json' } : {}),
          'X-Request-Id': nextRequestId(),
          ...config.getDefaultHeaders?.(),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
        body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
        signal: signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal,
      });
    } catch (error) {
      // React Native's fetch (whatwg-fetch) rejects EVERY abort with a plain
      // AbortError and drops the signal's reason, so a timeout would surface
      // as `cancelled` — never retried, wrong message. The client owns the
      // timeout signal, so it classifies timeouts itself.
      if (timeoutSignal.aborted && !signal?.aborted) {
        throw new AppError({
          kind: 'timeout',
          message: `Request timed out after ${timeoutMs} ms`,
          cause: error,
        });
      }
      throw error;
    }
  };

  const request = async <T>(
    method: HttpMethod,
    path: string,
    options: RequestOptions<T> = {},
  ): Promise<T> => {
    const useAuth = options.auth !== false;
    const startedAt = Date.now();

    try {
      let response = await send(
        method,
        path,
        options,
        useAuth ? (auth?.getAccessToken() ?? null) : null,
      );

      if (response.status === 401 && useAuth && auth) {
        const freshToken = await refreshOnce();
        if (!freshToken) {
          auth.onSessionExpired();
          throw new AppError({ kind: 'unauthorized', status: 401, message: 'Session expired' });
        }
        response = await send(method, path, options, freshToken);
      }

      const payload = await readBody(response);

      if (!response.ok) {
        const { message, code, fieldErrors } = parseErrorBody(payload);
        throw new AppError({
          kind: kindFromStatus(response.status),
          status: response.status,
          message: message ?? `Request failed with status ${response.status}`,
          code,
          fieldErrors,
        });
      }

      if (!options.schema) return payload as T;

      const parsed = options.schema.safeParse(payload);
      if (!parsed.success) {
        // Contract drift between app and API: report it, never render garbage.
        throw new AppError({
          kind: 'parse',
          status: response.status,
          message: `Unexpected response shape for ${method} ${path}`,
          cause: parsed.error,
        });
      }
      return parsed.data;
    } catch (error) {
      const appError = toAppError(error);
      // Requests the caller cancelled (e.g. screen unmounted) are not failures.
      if (options.signal?.aborted) {
        throw new AppError({ kind: 'cancelled', message: 'Request cancelled', cause: error });
      }
      logger.warn('HTTP request failed', {
        method,
        path,
        kind: appError.kind,
        status: appError.status,
        durationMs: Date.now() - startedAt,
      });
      throw appError;
    }
  };

  return {
    request,
    get: <T>(path: string, options?: Omit<RequestOptions<T>, 'body'>) =>
      request<T>('GET', path, options),
    post: <T>(path: string, options?: RequestOptions<T>) => request<T>('POST', path, options),
    put: <T>(path: string, options?: RequestOptions<T>) => request<T>('PUT', path, options),
    patch: <T>(path: string, options?: RequestOptions<T>) => request<T>('PATCH', path, options),
    delete: <T>(path: string, options?: RequestOptions<T>) => request<T>('DELETE', path, options),
    /** Wired once at bootstrap by the auth module (avoids an import cycle). */
    setAuthHandlers: (handlers: AuthHandlers | null) => {
      auth = handlers;
    },
  };
};

export type HttpClient = ReturnType<typeof createHttpClient>;

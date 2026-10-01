/**
 * Tiny in-app mock backend for development (`USE_MOCK_API=true`).
 *
 * Features register handlers from their own `mocks.ts`; the app registers
 * them at bootstrap inside an `if (__DEV__)` block so none of this ships in
 * release bundles. Not a test tool — tests mock at the module boundary.
 */
import { env } from '@/core/config';

export interface MockRequest {
  method: string;
  path: string;
  params: Record<string, string>;
  query: URLSearchParams;
  body: unknown;
  headers: Record<string, string>;
}

export interface MockResponse {
  status?: number;
  body?: unknown;
  /** Simulated latency in ms. */
  delay?: number;
}

export type MockHandler = (request: MockRequest) => MockResponse | Promise<MockResponse>;

interface Route {
  method: string;
  pattern: RegExp;
  keys: string[];
  handler: MockHandler;
}

const routes: Route[] = [];
const DEFAULT_DELAY_MS = 400;
/** Routes are registered relative to API_URL, e.g. `/items/:id`. */
const BASE_PATH = new URL(env.API_URL).pathname.replace(/\/$/, '');

const compile = (path: string): { pattern: RegExp; keys: string[] } => {
  const keys: string[] = [];
  const source = path.replace(/\/:([A-Za-z0-9_]+)/g, (_, key: string) => {
    keys.push(key);
    return '/([^/]+)';
  });
  return { pattern: new RegExp(`^${source}/?$`), keys };
};

export const registerMockRoute = (method: string, path: string, handler: MockHandler): void => {
  routes.push({ method: method.toUpperCase(), ...compile(path), handler });
};

const sleep = (ms: number, signal?: AbortSignal | null) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason instanceof Error ? signal.reason : new Error('Aborted'));
    });
  });

const json = (status: number, body: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const mockFetch: typeof fetch = async (input, init) => {
  const url = new URL(
    typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
  );
  const method = (init?.method ?? 'GET').toUpperCase();
  const headers = (init?.headers ?? {}) as Record<string, string>;
  const path = url.pathname.startsWith(BASE_PATH)
    ? url.pathname.slice(BASE_PATH.length) || '/'
    : url.pathname;

  for (const route of routes) {
    if (route.method !== method) continue;
    const match = route.pattern.exec(path);
    if (!match) continue;

    const params = Object.fromEntries(
      route.keys.map((key, i) => [key, decodeURIComponent(match[i + 1] ?? '')]),
    );
    const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as unknown) : undefined;
    const result = await route.handler({
      method,
      path,
      params,
      query: url.searchParams,
      body,
      headers,
    });
    await sleep(result.delay ?? DEFAULT_DELAY_MS, init?.signal);
    return json(result.status ?? 200, result.body);
  }

  await sleep(DEFAULT_DELAY_MS, init?.signal);
  return json(404, { message: `No mock registered for ${method} ${path}` });
};

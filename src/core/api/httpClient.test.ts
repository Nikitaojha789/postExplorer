import { z } from 'zod';

import { AppError } from '@/core/errors';

import { createHttpClient } from './httpClient';

const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const setup = (handler: (url: string, init: RequestInit) => Response | Promise<Response>) => {
  const fetchImpl = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    return Promise.resolve(handler(url, init ?? {}));
  });
  const client = createHttpClient({
    baseUrl: 'https://api.test/v1',
    timeoutMs: 1_000,
    fetchImpl,
  });
  return { client, fetchImpl };
};

const authHeader = (init: RequestInit) => (init.headers as Record<string, string>).Authorization;

describe('createHttpClient', () => {
  it('builds URLs, drops empty query params and validates the response', async () => {
    const { client, fetchImpl } = setup(() => json(200, { id: 1, name: 'x' }));
    const result = await client.get('/things', {
      query: { page: 2, q: 'a b', empty: undefined, none: null },
      schema: z.object({ id: z.number(), name: z.string() }),
    });

    expect(result).toEqual({ id: 1, name: 'x' });
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.test/v1/things?page=2&q=a%20b',
      expect.anything(),
    );
  });

  it('throws a parse AppError when the response breaks the contract', async () => {
    const { client } = setup(() => json(200, { id: 'not-a-number' }));
    await expect(
      client.get('/things', { schema: z.object({ id: z.number() }) }),
    ).rejects.toMatchObject({
      kind: 'parse',
    });
  });

  it('maps HTTP errors and extracts message, code and field errors', async () => {
    const { client } = setup(() =>
      json(422, { message: 'Invalid', code: 'E_VALIDATION', errors: { email: ['Taken'] } }),
    );
    const error = await client.post('/users', { body: {} }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({
      kind: 'validation',
      status: 422,
      message: 'Invalid',
      code: 'E_VALIDATION',
      fieldErrors: { email: 'Taken' },
    });
  });

  it('refreshes once for concurrent 401s, then retries each request with the new token', async () => {
    let token = 'stale';
    const { client, fetchImpl } = setup((_url, init) =>
      authHeader(init) === 'Bearer fresh' ? json(200, { ok: true }) : json(401),
    );
    const refreshAccessToken = jest.fn(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      token = 'fresh';
      return token;
    });
    client.setAuthHandlers({
      getAccessToken: () => token,
      refreshAccessToken,
      onSessionExpired: jest.fn(),
    });

    const results = await Promise.all([client.get('/a'), client.get('/b'), client.get('/c')]);

    expect(results).toEqual([{ ok: true }, { ok: true }, { ok: true }]);
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledTimes(6);
  });

  it('expires the session when the refresh is rejected', async () => {
    const { client } = setup(() => json(401));
    const onSessionExpired = jest.fn();
    client.setAuthHandlers({
      getAccessToken: () => 'stale',
      refreshAccessToken: () => Promise.resolve(null),
      onSessionExpired,
    });

    await expect(client.get('/me')).rejects.toMatchObject({ kind: 'unauthorized' });
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it('does not attach credentials or refresh for auth: false requests', async () => {
    const { client, fetchImpl } = setup(() => json(401, { message: 'Bad credentials' }));
    const refreshAccessToken = jest.fn();
    client.setAuthHandlers({
      getAccessToken: () => 'token',
      refreshAccessToken,
      onSessionExpired: jest.fn(),
    });

    await expect(client.post('/auth/sign-in', { body: {}, auth: false })).rejects.toMatchObject({
      kind: 'unauthorized',
      message: 'Bad credentials',
    });
    expect(refreshAccessToken).not.toHaveBeenCalled();
    expect(authHeader(fetchImpl.mock.calls[0]?.[1] ?? {})).toBeUndefined();
  });

  it('reports caller cancellation as `cancelled`, not as a failure', async () => {
    const controller = new AbortController();
    const { client } = setup(
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
          );
        }),
    );
    const pending = client.get('/slow', { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ kind: 'cancelled' });
  });
});

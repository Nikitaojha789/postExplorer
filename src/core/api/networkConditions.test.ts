import { onlineManager } from '@tanstack/react-query';

import { toAppError } from '@/core/errors';
import { setSimulatedOffline } from '@/core/network';

import { createHttpClient } from './httpClient';
import {
  resetNetworkConditions,
  setNetworkConditions,
  withNetworkConditions,
} from './networkConditions';

const okFetch = jest.fn(() =>
  Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })),
);
const client = createHttpClient({
  baseUrl: 'https://api.test',
  timeoutMs: 1_000,
  fetchImpl: withNetworkConditions(okFetch),
});

const failureKind = async (promise: Promise<unknown>) => {
  try {
    await promise;
    return 'resolved';
  } catch (error) {
    return toAppError(error).kind;
  }
};

afterEach(() => {
  resetNetworkConditions();
  setSimulatedOffline(false);
  okFetch.mockClear();
});

describe('network conditions', () => {
  it('passes requests straight through by default', async () => {
    await expect(client.get('/x')).resolves.toEqual({ ok: true });
    expect(okFetch).toHaveBeenCalledTimes(1);
  });

  it('fails like a dropped connection at a 100% failure rate', async () => {
    setNetworkConditions({ failureRate: 1 });
    expect(await failureKind(client.get('/x'))).toBe('network');
    expect(okFetch).not.toHaveBeenCalled();
  });

  it('turns latency beyond the client timeout into a timeout error', async () => {
    setNetworkConditions({ latencyMs: 5_000 });
    expect(await failureKind(client.get('/x', { timeoutMs: 50 }))).toBe('timeout');
  });

  it('simulated offline fails requests and flips the app-wide online state', async () => {
    setSimulatedOffline(true);
    expect(onlineManager.isOnline()).toBe(false);
    expect(await failureKind(client.get('/x'))).toBe('network');

    setSimulatedOffline(false);
    expect(onlineManager.isOnline()).toBe(true);
  });
});

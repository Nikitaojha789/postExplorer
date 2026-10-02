import { isSimulatedOffline } from '@/core/network';

/**
 * Dev tooling: simulated network conditions for exercising loading, retry,
 * timeout and offline UX against any backend (real or mock). Wired only in
 * `__DEV__` builds (see client.ts); toggled from the Dev Menu.
 */
export interface NetworkConditions {
  /** Extra latency added before every request, in ms. */
  latencyMs: number;
  /** Probability (0–1) that a request fails like a dropped connection. */
  failureRate: number;
}

const DEFAULT_CONDITIONS: NetworkConditions = { latencyMs: 0, failureRate: 0 };
const OFFLINE_FAILURE_DELAY_MS = 150;

let conditions = DEFAULT_CONDITIONS;

export const getNetworkConditions = (): NetworkConditions => conditions;

export const setNetworkConditions = (next: Partial<NetworkConditions>): void => {
  conditions = { ...conditions, ...next };
};

export const resetNetworkConditions = (): void => {
  conditions = DEFAULT_CONDITIONS;
};

/**
 * Abort reasons are DOMExceptions, which aren't always `instanceof Error`.
 * Re-wrap as an Error that KEEPS the `name` (TimeoutError/AbortError): the
 * name is what maps it to an AppError kind.
 */
const abortReason = (signal: AbortSignal): Error => {
  const reason: unknown = signal.reason;
  if (reason instanceof Error) return reason;
  const { name = 'AbortError', message = 'Aborted' } = (reason ?? {}) as {
    name?: string;
    message?: string;
  };
  return Object.assign(new Error(message), { name });
};

const sleep = (ms: number, signal?: AbortSignal | null) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortReason(signal));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(abortReason(signal));
    });
  });

/** Same failure as RN's fetch on a dropped connection → AppError `network`. */
const networkFailure = () => new TypeError('Network request failed (simulated)');

/** Wraps a fetch implementation. With default conditions it costs one read per request. */
export const withNetworkConditions =
  (fetchImpl: typeof fetch): typeof fetch =>
  async (input, init) => {
    if (isSimulatedOffline()) {
      await sleep(OFFLINE_FAILURE_DELAY_MS, init?.signal);
      throw networkFailure();
    }
    const { latencyMs, failureRate } = conditions;
    if (latencyMs > 0) await sleep(latencyMs, init?.signal);
    if (failureRate > 0 && Math.random() < failureRate) throw networkFailure();
    return fetchImpl(input, init);
  };

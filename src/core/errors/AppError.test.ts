import { AppError, kindFromStatus, toAppError } from './AppError';

describe('kindFromStatus', () => {
  it.each([
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [404, 'not_found'],
    [409, 'conflict'],
    [422, 'validation'],
    [429, 'rate_limited'],
    [503, 'server'],
    [418, 'unknown'],
  ] as const)('maps %i → %s', (status, kind) => {
    expect(kindFromStatus(status)).toBe(kind);
  });
});

describe('toAppError', () => {
  it('returns AppErrors unchanged', () => {
    const error = new AppError({ kind: 'server', message: 'boom', status: 500 });
    expect(toAppError(error)).toBe(error);
  });

  it('classifies aborts, timeouts and network failures', () => {
    const abort = Object.assign(new Error('aborted'), { name: 'AbortError' });
    const timeout = Object.assign(new Error('timed out'), { name: 'TimeoutError' });
    expect(toAppError(abort).kind).toBe('cancelled');
    expect(toAppError(timeout).kind).toBe('timeout');
    expect(toAppError(new TypeError('Network request failed')).kind).toBe('network');
  });

  it('wraps non-Error values', () => {
    expect(toAppError('oops')).toMatchObject({ kind: 'unknown', message: 'oops' });
  });
});

describe('AppError flags', () => {
  it('retries only transient failures', () => {
    expect(new AppError({ kind: 'network', message: '' }).isRetryable).toBe(true);
    expect(new AppError({ kind: 'server', status: 502, message: '' }).isRetryable).toBe(true);
    expect(new AppError({ kind: 'validation', status: 422, message: '' }).isRetryable).toBe(false);
    expect(new AppError({ kind: 'unauthorized', status: 401, message: '' }).isRetryable).toBe(
      false,
    );
  });
});

describe('toAppError with non-Error abort reasons', () => {
  it('classifies cross-realm or polyfilled DOMExceptions by name', () => {
    expect(toAppError({ name: 'TimeoutError', message: 'signal timed out' }).kind).toBe('timeout');
    expect(toAppError({ name: 'AbortError', message: 'aborted' }).kind).toBe('cancelled');
    expect(toAppError({ name: 'Other' }).kind).toBe('unknown');
  });
});

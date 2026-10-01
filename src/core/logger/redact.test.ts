import { redact } from './redact';

describe('redact', () => {
  it('masks sensitive keys at any depth, case-insensitively', () => {
    expect(
      redact({
        email: 'a@b.co',
        password: 'hunter2',
        nested: { refreshToken: 'abc', Authorization: 'Bearer xyz', list: [{ otp: '1234' }] },
      }),
    ).toEqual({
      email: 'a@b.co',
      password: '[REDACTED]',
      nested: {
        refreshToken: '[REDACTED]',
        Authorization: '[REDACTED]',
        list: [{ otp: '[REDACTED]' }],
      },
    });
  });

  it('scrubs bearer tokens and JWTs inside free text', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl';
    expect(redact(`failed with Bearer abc.def and ${jwt}`)).toBe(
      'failed with Bearer [REDACTED] and [REDACTED]',
    );
  });

  it('survives cycles and bounds depth', () => {
    const cyclic: Record<string, unknown> = { name: 'root' };
    cyclic.self = cyclic;
    expect(redact(cyclic)).toEqual({ name: 'root', self: '[Circular]' });

    const deep = { a: { b: { c: { d: { e: { f: { g: 1 } } } } } } };
    expect(JSON.stringify(redact(deep))).toContain('[Truncated]');
  });
});

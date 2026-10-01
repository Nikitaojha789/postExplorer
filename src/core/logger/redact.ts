const REDACTED = '[REDACTED]';
const MAX_DEPTH = 6;

/**
 * Keys whose values must never leave the device in logs, breadcrumbs or
 * crash reports. Matching is case-insensitive and substring-based so that
 * `refreshToken`, `x-auth-token` and `Authorization` are all caught.
 */
const SENSITIVE_KEY_PATTERN =
  /pass(word)?|secret|token|authorization|cookie|session|otp|pin|cvv|card|iban|ssn|national.?id|emirates.?id|api.?key/i;

const BEARER_PATTERN = /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g;
const JWT_PATTERN = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;

const redactString = (value: string): string =>
  value.replace(BEARER_PATTERN, `Bearer ${REDACTED}`).replace(JWT_PATTERN, REDACTED);

/**
 * Returns a deep copy of `value` with sensitive fields masked. Safe on cycles,
 * bounded in depth so a huge payload can't stall the JS thread.
 */
export const redact = (value: unknown, depth = 0, seen = new WeakSet<object>()): unknown => {
  if (typeof value === 'string') return redactString(value);
  if (value === null || typeof value !== 'object') return value;
  if (depth >= MAX_DEPTH) return '[Truncated]';
  if (seen.has(value)) return '[Circular]';
  seen.add(value);

  if (value instanceof Error) {
    return { name: value.name, message: redactString(value.message) };
  }
  if (Array.isArray(value)) {
    return value.map(item => redact(item, depth + 1, seen));
  }

  const output: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    output[key] = SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : redact(entry, depth + 1, seen);
  }
  return output;
};

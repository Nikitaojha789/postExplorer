import { redact } from './redact';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  /** Already redacted. */
  context?: unknown;
  error?: unknown;
  timestamp: number;
}

/** A destination for log entries (console, crash reporter breadcrumbs, file…). */
export interface LogTransport {
  readonly minLevel: LogLevel;
  write(entry: LogEntry): void;
}

const LEVEL_WEIGHT: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const transports: LogTransport[] = [];

export const addLogTransport = (transport: LogTransport): (() => void) => {
  transports.push(transport);
  return () => {
    const index = transports.indexOf(transport);
    if (index >= 0) transports.splice(index, 1);
  };
};

const emit = (level: LogLevel, message: string, context?: unknown, error?: unknown) => {
  if (transports.length === 0) return;
  const weight = LEVEL_WEIGHT[level];
  // Redact lazily: skip the deep copy entirely when nothing would accept it.
  if (!transports.some(t => LEVEL_WEIGHT[t.minLevel] <= weight)) return;

  const entry: LogEntry = {
    level,
    message,
    context: context === undefined ? undefined : redact(context),
    error,
    timestamp: Date.now(),
  };
  for (const transport of transports) {
    if (LEVEL_WEIGHT[transport.minLevel] <= weight) {
      try {
        transport.write(entry);
      } catch {
        // A broken transport must never break the app.
      }
    }
  }
};

/**
 * App-wide logger. Never call `console.*` directly in app code — the ESLint
 * `no-console` rule enforces this — so redaction and routing stay centralised.
 */
export const logger = {
  debug: (message: string, context?: unknown) => emit('debug', message, context),
  info: (message: string, context?: unknown) => emit('info', message, context),
  warn: (message: string, context?: unknown) => emit('warn', message, context),
  error: (message: string, error?: unknown, context?: unknown) =>
    emit('error', message, context, error),
} as const;

/** Development console transport. Registered only in `__DEV__` builds. */
export const consoleTransport: LogTransport = {
  minLevel: 'debug',
  write({ level, message, context, error }) {
    /* eslint-disable no-console */
    const args: unknown[] = [`[${level.toUpperCase()}] ${message}`];
    if (context !== undefined) args.push(context);
    if (error !== undefined) args.push(error);
    if (level === 'debug') console.log(...args);
    else console[level](...args);
    /* eslint-enable no-console */
  },
};

import NativeConfig from 'react-native-config';
import { z } from 'zod';

/**
 * Typed, validated runtime configuration.
 *
 * Values come from `.env.<environment>` files, selected at BUILD time by the
 * Android product flavor / iOS scheme (see docs/ENVIRONMENTS.md), and are
 * exposed by react-native-config. Everything here ships inside the app binary
 * and must be treated as PUBLIC — never put secrets in an .env file.
 */
const optionalString = z
  .string()
  .trim()
  .transform(value => (value === '' ? undefined : value))
  .optional();

const booleanFlag = z
  .enum(['true', 'false'])
  .default('false')
  .transform(value => value === 'true');

const EnvSchema = z.object({
  APP_ENV: z.enum(['development', 'qa', 'staging', 'production']),
  API_URL: z.url(),
  API_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  DEEP_LINK_SCHEME: z.string().regex(/^[a-z][a-z0-9+.-]*$/),
  DEEP_LINK_HOST: optionalString,
  SENTRY_DSN: optionalString,
  /** Serve API calls from in-app mocks. Honoured in __DEV__ builds only. */
  USE_MOCK_API: booleanFlag,
});

export type Env = z.infer<typeof EnvSchema>;
export type AppEnvironment = Env['APP_ENV'];

const parseEnv = (): Env => {
  const result = EnvSchema.safeParse(NativeConfig);
  if (!result.success) {
    // A misconfigured build must fail loudly in QA rather than run with
    // undefined endpoints in front of users.
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(result.error)}`);
  }
  return Object.freeze(result.data);
};

export const env: Readonly<Env> = parseEnv();

export const isProduction = env.APP_ENV === 'production';
export const useMockApi = __DEV__ && env.USE_MOCK_API;

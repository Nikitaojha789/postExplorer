/** Mirrors .env.development with mocks off — tests mock at module boundaries. */
const Config = {
  APP_ENV: 'development',
  API_URL: 'https://api.test.local',
  API_TIMEOUT_MS: '5000',
  DEEP_LINK_SCHEME: 'baseline-test',
  DEEP_LINK_HOST: 'app.test.local',
  SENTRY_DSN: '',
  USE_MOCK_API: 'false',
};

export default Config;
export { Config };

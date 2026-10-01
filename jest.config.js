/** @type {import('jest').Config} */
module.exports = {
  preset: '@react-native/jest-preset',
  // Reanimated 4 ships a resolver that swaps in its JS implementation.
  resolver: 'react-native-reanimated/jest/resolver',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
  },
  // Native-module packages ship untranspiled ESM/Flow and must go through Babel.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|@shopify/flash-list|react-native-.*|@d11/react-native-fast-image|@sentry/react-native|@formatjs)/)',
  ],
  // `*.perf-test.tsx` files don't match the default testMatch; Reassure runs them.
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/index.ts', '!src/**/*.d.ts'],
  // Ratchet: set just below the current measured coverage. Raise these when
  // coverage grows; never lower them to make a PR pass.
  coverageThreshold: {
    global: { statements: 60, branches: 50, functions: 48, lines: 60 },
  },
};

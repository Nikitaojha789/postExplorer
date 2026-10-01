/**
 * Global test setup. Native modules have no JS implementation under Jest, so
 * each one is replaced here — preferring the library's own official mock.
 * MMKV v4 switches to an in-memory mock under Jest, but still imports
 * react-native-nitro-modules eagerly — so Nitro itself is stubbed below.
 */
import 'react-native-gesture-handler/jestSetup';
// Gives FlashList deterministic layout measurements (official setup).
import '@shopify/flash-list/jestSetup';
import { setUpTests } from 'react-native-reanimated';

setUpTests();

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('react-native-keyboard-controller', () =>
  require('react-native-keyboard-controller/jest'),
);
jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js'),
);
jest.mock('react-native-device-info', () =>
  require('react-native-device-info/jest/react-native-device-info-mock'),
);
jest.mock('react-native-localize', () => require('react-native-localize/mock'));
jest.mock('react-native-permissions', () => require('react-native-permissions/mock'));

jest.mock('react-native-nitro-modules', () => ({
  NitroModules: { createHybridObject: jest.fn() },
}));
jest.mock('react-native-config', () => require('./test/mocks/react-native-config'));
jest.mock('react-native-keychain', () => require('./test/mocks/react-native-keychain'));
jest.mock('react-native-restart', () => ({ __esModule: true, default: { restart: jest.fn() } }));
jest.mock('react-native-bootsplash', () => ({
  __esModule: true,
  default: { hide: jest.fn(() => Promise.resolve()), isVisible: jest.fn(() => false) },
}));
jest.mock('@d11/react-native-fast-image', () => require('./test/mocks/react-native-fast-image'));
jest.mock('@sentry/react-native', () => require('./test/mocks/sentry'));

const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withSentryConfig } = require('@sentry/react-native/metro');

/**
 * Metro configuration — https://reactnative.dev/docs/metro
 *
 * Defaults already enable `inlineRequires` (lazy module evaluation), which is
 * the single biggest startup win; keep module scope free of side effects so it
 * stays effective. `withSentryConfig` adds Debug IDs for source-map matching.
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {};

module.exports = withSentryConfig(mergeConfig(getDefaultConfig(__dirname), config));

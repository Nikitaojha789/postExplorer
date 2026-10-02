// ESLint 10 flat config, composed by hand.
// We deliberately do NOT extend `@react-native/eslint-config`: its bundled
// plugins (eslint-plugin-react, react-native, eslint-comments, ft-flow) still
// call APIs removed in ESLint 10. Everything below declares ESLint 10 support.
import js from '@eslint/js';
import reactNative from '@react-native/eslint-plugin';
import prettier from 'eslint-config-prettier';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import boundaries from 'eslint-plugin-boundaries';
import importX from 'eslint-plugin-import-x';
import jest from 'eslint-plugin-jest';
import reactHooks from 'eslint-plugin-react-hooks';
import testingLibrary from 'eslint-plugin-testing-library';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const SRC = 'src/**/*.{ts,tsx}';

/**
 * Architecture layers (see docs/ARCHITECTURE.md). A layer may import only
 * from layers listed in its `allow` — enforced by eslint-plugin-boundaries.
 *
 *   shared  ←  core  ←  ui  ←  features  ←  app
 */
const ELEMENTS = [
  { type: 'app', pattern: 'src/app' },
  { type: 'feature', pattern: 'src/features/*', capture: ['feature'] },
  { type: 'ui', pattern: 'src/ui' },
  { type: 'core', pattern: 'src/core/*', capture: ['module'] },
  { type: 'shared', pattern: 'src/shared' },
  { type: 'assets', pattern: 'src/assets' },
];

const allow = (from, types) => ({
  from: { element: { type: from } },
  allow: { to: { element: { types: { anyOf: types } } } },
});

/** react-native exports that have a better in-house or library replacement. */
const RESTRICTED_RN_IMPORTS = [
  { name: 'Image', message: 'Use <Image> from @/ui (cached, recycling-aware).' },
  { name: 'FlatList', message: 'Use FlashList from @shopify/flash-list (see PERFORMANCE.md).' },
  { name: 'SectionList', message: 'Use FlashList with sticky headers.' },
  { name: 'SafeAreaView', message: 'Deprecated. Use <Screen> from @/ui or useSafeAreaInsets().' },
  { name: 'KeyboardAvoidingView', message: 'Use react-native-keyboard-controller.' },
  { name: 'TouchableOpacity', message: 'Use <Pressable> / <Button> from @/ui.' },
  { name: 'TouchableHighlight', message: 'Use <Pressable> / <Button> from @/ui.' },
  { name: 'TouchableWithoutFeedback', message: 'Use <Pressable> / <Button> from @/ui.' },
  { name: 'Text', message: 'Use <Text> from @/ui (typography + theming + a11y defaults).' },
  { name: 'TextInput', message: 'Use <TextField> from @/ui.' },
];

const RESTRICTED_PACKAGES = [
  { name: 'axios', message: 'Use the shared http client in @/core/api.' },
  { name: 'moment', message: 'Use Intl / Date APIs (moment is legacy and heavy).' },
  { name: 'lodash', message: 'Import a single function or write the util in @/shared.' },
  { name: '@react-native-async-storage/async-storage', message: 'Use @/core/storage (MMKV).' },
];

/** Native/vendor SDKs that only their owning core module may touch. */
const VENDOR_OWNERS = [
  { pkg: 'react-native-mmkv', owner: 'src/core/storage/**' },
  { pkg: 'react-native-keychain', owner: 'src/core/storage/**' },
  { pkg: '@sentry/react-native', owner: 'src/core/monitoring/**' },
  { pkg: 'react-native-config', owner: 'src/core/config/**' },
  { pkg: '@react-native-community/netinfo', owner: 'src/core/network/**' },
  { pkg: 'react-native-device-info', owner: 'src/core/config/**' },
  { pkg: 'react-native-permissions', owner: 'src/core/permissions/**' },
  { pkg: 'react-native-localize', owner: 'src/core/i18n/**' },
  { pkg: 'react-native-restart', owner: 'src/core/i18n/**' },
];

export default tseslint.config(
  {
    ignores: [
      'node_modules/',
      'android/',
      'ios/',
      'coverage/',
      'vendor/',
      '.reassure/',
      '*.config.js',
      'index.js',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.es2024, __DEV__: 'readonly' },
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: { globals: { ...globals.node } },
  },

  // ── React / React Native ────────────────────────────────────────────────
  reactHooks.configs.flat.recommended,
  {
    files: [SRC],
    plugins: { '@react-native': reactNative },
    rules: {
      '@react-native/no-deep-imports': 'error',
      '@react-native/platform-colors': 'error',
    },
  },

  // ── Imports ─────────────────────────────────────────────────────────────
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  {
    settings: {
      'import-x/resolver-next': [createTypeScriptImportResolver({ alwaysTryTypes: true })],
    },
    rules: {
      'import-x/no-cycle': ['error', { maxDepth: 10, ignoreExternal: true }],
      'import-x/no-default-export': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/no-named-as-default-member': 'off',
      'import-x/no-named-as-default': 'off', // TypeScript already checks default imports.
      'import-x/order': [
        'error',
        {
          // react / react-native first, then third-party, then @/ aliases, then relatives.
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
          pathGroups: [
            { pattern: '{react,react-native}', group: 'builtin', position: 'after' },
            { pattern: '@/**', group: 'internal' },
            { pattern: '@test/**', group: 'internal' },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },

  // ── Architecture boundaries ─────────────────────────────────────────────
  {
    files: [SRC],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': ELEMENTS,
      'boundaries/include': ['src/**/*'],
      'import/resolver': { typescript: { alwaysTryTypes: true } },
    },
    rules: {
      // Every file in src/ must belong to a known layer — no new top-level
      // folders like src/helpers or src/services.
      'boundaries/no-unknown-files': 'error',
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            allow('shared', ['shared', 'assets']),
            allow('core', ['core', 'shared', 'assets']),
            allow('ui', ['ui', 'core', 'shared', 'assets']),
            allow('feature', ['ui', 'core', 'shared', 'assets']),
            // A feature may import its own files but never another feature.
            {
              from: { element: { type: 'feature' } },
              allow: {
                to: {
                  element: {
                    type: 'feature',
                    captured: { feature: '{{from.element.captured.feature}}' },
                  },
                },
              },
            },
            allow('app', ['app', 'ui', 'core', 'shared', 'assets']),
            // Outside a feature, reach it only through its public `index.ts`
            // (or `mocks.ts`, which only the dev-only bootstrap imports).
            {
              from: { element: { type: 'app' } },
              allow: { to: { element: { type: 'feature', fileInternalPath: '{index,mocks}.ts' } } },
            },
          ],
        },
      ],
    },
  },

  // ── Project conventions ─────────────────────────────────────────────────
  {
    files: [SRC],
    rules: {
      'no-console': 'error',
      eqeqeq: ['error', 'smart'],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: RESTRICTED_RN_IMPORTS.map(r => r.name),
              message: 'See eslint.config.mjs → RESTRICTED_RN_IMPORTS for the replacement.',
            },
            ...RESTRICTED_PACKAGES,
            ...VENDOR_OWNERS.map(({ pkg, owner }) => ({
              name: pkg,
              message: `Only ${owner} may import ${pkg}; use its public API instead.`,
            })),
          ],
          patterns: [
            { group: ['../../**'], message: 'Use the @/ alias instead of deep relative imports.' },
          ],
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      // Its autofix rewrites `as T` into `x!`, which the rule above rejects.
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='Dimensions'][property.name='get']",
          message:
            'Use useWindowDimensions() so layout reacts to rotation, split-screen and foldables.',
        },
        {
          selector: 'TSEnumDeclaration',
          message: 'Use a `const` object + union type instead of enums.',
        },
      ],
    },
  },

  // The design system wraps the primitives it bans everywhere else.
  {
    files: ['src/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: RESTRICTED_PACKAGES,
          patterns: [{ group: ['../../**'], message: 'Use @/ alias.' }],
        },
      ],
    },
  },
  // Owning modules may import THEIR vendor SDKs — and still no one else's.
  ...[...new Set(VENDOR_OWNERS.map(v => v.owner))].map(owner => ({
    files: [owner.replace('/**', '/**/*.{ts,tsx}')],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            ...RESTRICTED_PACKAGES,
            ...VENDOR_OWNERS.filter(v => v.owner !== owner).map(({ pkg, owner: other }) => ({
              name: pkg,
              message: `Only ${other} may import ${pkg}; use its public API instead.`,
            })),
          ],
        },
      ],
    },
  })),
  // The app shell wires vendor SDKs (e.g. Sentry wrap) at the composition root.
  {
    files: ['src/app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: RESTRICTED_RN_IMPORTS.map(r => r.name),
              message: 'See eslint.config.mjs → RESTRICTED_RN_IMPORTS.',
            },
            ...RESTRICTED_PACKAGES,
          ],
        },
      ],
    },
  },

  // ── Tests ───────────────────────────────────────────────────────────────
  {
    files: ['**/*.test.{ts,tsx}', '**/*.perf-test.{ts,tsx}', 'test/**/*.{ts,tsx}', 'jest.setup.ts'],
    ...jest.configs['flat/recommended'],
    ...testingLibrary.configs['flat/react'],
    plugins: {
      ...jest.configs['flat/recommended'].plugins,
      ...testingLibrary.configs['flat/react'].plugins,
    },
    languageOptions: { globals: { ...globals.jest } },
    rules: {
      ...jest.configs['flat/recommended'].rules,
      ...testingLibrary.configs['flat/react'].rules,
      'boundaries/dependencies': 'off',
      'boundaries/entry-point': 'off',
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/unbound-method': 'off',
      // `require()` inside jest.mock factories is the idiomatic Jest pattern.
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      'import-x/no-default-export': 'off',
      'jest/expect-expect': ['error', { assertFunctionNames: ['expect', 'measureRenders'] }],
      // RNTL 14's `fireEvent` is async: it must be awaited (no-floating-promises),
      // which this web-oriented rule forbids. Prefer `userEvent` for interactions.
      'testing-library/no-await-sync-events': 'off',
    },
  },
  // Config files legitimately default-export.
  {
    files: ['*.config.{mjs,ts}', 'scripts/**'],
    rules: { 'import-x/no-default-export': 'off' },
  },

  prettier,
);

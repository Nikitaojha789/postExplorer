/**
 * Plugin order matters:
 *  1. React Compiler must run FIRST so it sees the original source.
 *  2. module-resolver maps the `@/` alias (mirrors tsconfig `paths`).
 *  3. Worklets plugin must be LAST (Reanimated 4 requirement).
 *
 * class-static-block: @formatjs/intl-locale (the Intl polyfill chain needed
 * by Hermes) ships ES2022 static blocks, which neither the RN preset nor
 * Hermes handles — release bundling fails without it.
 * export-namespace-from: zod 4 uses `export * as z from` (documented by zod).
 */
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'babel-plugin-react-compiler',
    '@babel/plugin-transform-class-static-block',
    '@babel/plugin-transform-export-namespace-from',
    [
      'module-resolver',
      {
        root: ['./'],
        extensions: [
          '.ios.ts',
          '.android.ts',
          '.ts',
          '.ios.tsx',
          '.android.tsx',
          '.tsx',
          '.js',
          '.json',
        ],
        alias: { '@': './src', '@test': './test' },
      },
    ],
    'react-native-worklets/plugin',
  ],
};

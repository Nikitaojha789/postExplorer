# Dependencies

Every dependency, why it's here, how healthy it is, what it costs, and what we'd use instead. Versions are what `package-lock.json` resolves today; "last release" dates come from the npm registry (checked 1 Oct 2026). Rationale for the bigger choices lives in [DECISIONS.md](./DECISIONS.md).

**Perf impact key:** 🟢 negligible/positive · 🟡 small, bounded · 🟠 measurable, justified

## Runtime (37)

### Platform & React

| Package        | Version | Purpose                                                          | Maintenance                       | Perf | Alternatives                  |
| -------------- | ------- | ---------------------------------------------------------------- | --------------------------------- | ---- | ----------------------------- |
| `react-native` | 0.87.1  | Framework                                                        | Meta, monthly releases (Aug 2026) | —    | Expo (framework on top of RN) |
| `react`        | 19.2.3  | UI library (version pinned by RN 0.87 — do **not** bump to 19.3) | Meta                              | —    | —                             |

### Navigation

| Package                          | Version | Purpose                                       | Maintenance                         | Perf                              | Alternatives                                          |
| -------------------------------- | ------- | --------------------------------------------- | ----------------------------------- | --------------------------------- | ----------------------------------------------------- |
| `@react-navigation/native`       | 7.5.0   | Navigation core, linking, theming             | Very active (Sep 2026); v8 in alpha | 🟢                                | Expo Router (Expo), RNN (Wix)                         |
| `@react-navigation/native-stack` | 7.20.0  | Native UINavigationController/Fragment stacks | Active                              | 🟢 transitions off JS thread      | `@react-navigation/stack` (JS)                        |
| `@react-navigation/bottom-tabs`  | 7.20.0  | Tab navigator                                 | Active                              | 🟢                                | native tabs (`/unstable`), `react-native-bottom-tabs` |
| `@react-navigation/elements`     | 2.9.44  | Peer of the navigators (headers, utils)       | Active                              | 🟢                                | —                                                     |
| `react-native-screens`           | 4.28.0  | Native screen containers                      | Software Mansion, Sep 2026          | 🟢 frees memory of hidden screens | —                                                     |
| `react-native-safe-area-context` | 5.10.1  | Insets for notches/edge-to-edge               | Sep 2026                            | 🟢                                | core `SafeAreaView` (deprecated)                      |

### Data

| Package                                   | Version | Purpose                                          | Maintenance            | Perf                                        | Alternatives                              |
| ----------------------------------------- | ------- | ------------------------------------------------ | ---------------------- | ------------------------------------------- | ----------------------------------------- |
| `@tanstack/react-query`                   | 5.104.0 | Server-state cache, retries, pagination, offline | Very active (Sep 2026) | 🟢 dedupe & caching cut network/render work | RTK Query, SWR                            |
| `@tanstack/query-async-storage-persister` | 5.104.0 | Persist opted-in queries                         | Same release train     | 🟡 throttled JSON serialisation             | `createSyncStoragePersister` (deprecated) |
| `@tanstack/react-query-persist-client`    | 5.104.0 | `PersistQueryClientProvider`                     | Same                   | 🟢                                          | —                                         |
| `zustand`                                 | 5.0.15  | Small global client state                        | pmndrs, Aug 2026       | 🟢 selector subscriptions                   | Redux Toolkit, Jotai                      |
| `zod`                                     | 4.6.5   | Schemas: API, env, storage, forms                | Sep 2026               | 🟡 linear parse cost; `jitless` on Hermes   | valibot, yup                              |
| `react-hook-form`                         | 7.89.0  | Forms (uncontrolled, few re-renders)             | Sep 2026               | 🟢                                          | TanStack Form, Formik (inactive)          |
| `@hookform/resolvers`                     | 5.9.1   | zod ↔ RHF bridge                                 | Aug 2026               | 🟢                                          | —                                         |

### Storage & security

| Package                      | Version | Purpose                                  | Maintenance                                                                          | Perf                                   | Alternatives                                         |
| ---------------------------- | ------- | ---------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------- | ---------------------------------------------------- |
| `react-native-mmkv`          | 4.3.2   | Synchronous KV storage (JSI/Nitro)       | mrousavy, Jun 2026                                                                   | 🟢 sync reads, no bridge               | AsyncStorage v3                                      |
| `react-native-nitro-modules` | 0.37.1  | Runtime for MMKV v4 (exact pin required) | Aug 2026                                                                             | 🟢                                     | —                                                    |
| `react-native-keychain`      | 10.0.0  | Keychain/Keystore for the refresh token  | Last release Mar 2025; TurboModule rewrite merged (Mar 2026), unreleased — **watch** | 🟡 Keystore crypto ms-level; read once | `react-native-sensitive-info` 6, `expo-secure-store` |

### UI, motion & input

| Package                            | Version | Purpose                                             | Maintenance                           | Perf                       | Alternatives                                                          |
| ---------------------------------- | ------- | --------------------------------------------------- | ------------------------------------- | -------------------------- | --------------------------------------------------------------------- |
| `react-native-reanimated`          | 4.7.0   | UI-thread animations, layout animations             | SWM, Sep 2026 (supports RN 0.86–0.88) | 🟢 off JS thread           | core `Animated`                                                       |
| `react-native-worklets`            | 0.13.0  | Worklet runtime for Reanimated (pinned to 0.13.x)   | SWM, Sep 2026                         | 🟢                         | —                                                                     |
| `react-native-gesture-handler`     | 3.3.0   | Native gestures (required by navigation/Reanimated) | SWM, Sep 2026                         | 🟢                         | core responder system                                                 |
| `@shopify/flash-list`              | 2.3.2   | Recycling virtualised list                          | Shopify, Jun 2026 (cadence slowed)    | 🟢 major win over FlatList | Legend List v3, FlatList                                              |
| `@d11/react-native-fast-image`     | 8.13.0  | Cached images (SDWebImage/Glide), Fabric-native     | Dream11, Nov 2025                     | 🟢 memory+disk cache       | `react-native-fast-image` (revived Sep 2026, legacy view), expo-image |
| `react-native-keyboard-controller` | 1.22.6  | Keyboard-aware scroll/avoidance                     | Very active (Sep 2026)                | 🟢 frame-synced            | core `KeyboardAvoidingView`                                           |
| `react-native-bootsplash`          | 7.3.4   | Native splash held until first screen               | Sep 2026                              | 🟢                         | Expo splash-screen                                                    |

### Platform services

| Package                           | Version | Purpose                                                           | Maintenance                          | Perf                                     | Alternatives                             |
| --------------------------------- | ------- | ----------------------------------------------------------------- | ------------------------------------ | ---------------------------------------- | ---------------------------------------- |
| `@sentry/react-native`            | 8.28.0  | Crashes, JS errors, perf tracing (behind facade; off without DSN) | Sep 2026                             | 🟡 small init cost; sampling 10% in prod | Crashlytics, Datadog, Bugsnag            |
| `react-native-config`             | 1.7.2   | Per-environment `.env` → JS + native                              | Aug 2026 (tested on 0.87 per README) | 🟢                                       | babel inline env (JS-only, cache issues) |
| `react-native-device-info`        | 15.0.2  | App version/build number                                          | Feb 2026                             | 🟢 sync getters                          | `expo-application`                       |
| `@react-native-community/netinfo` | 12.0.1  | Connectivity → TanStack `onlineManager`                           | Feb 2026                             | 🟢                                       | `expo-network`                           |
| `react-native-permissions`        | 5.6.2   | Unified permission checks/requests                                | Sep 2026                             | 🟢                                       | `PermissionsAndroid` + per-module APIs   |

### Internationalisation

| Package                              | Version | Purpose                                       | Maintenance | Perf                            | Alternatives         |
| ------------------------------------ | ------- | --------------------------------------------- | ----------- | ------------------------------- | -------------------- |
| `i18next`                            | 26.4.2  | Translation engine                            | Sep 2026    | 🟢 bundled resources, sync init | Lingui, FormatJS     |
| `react-i18next`                      | 17.0.15 | React bindings (`useTranslation`)             | Sep 2026    | 🟢                              | —                    |
| `react-native-localize`              | 3.7.2   | Device locale detection                       | Sep 2026    | 🟢                              | `expo-localization`  |
| `@formatjs/intl-pluralrules`         | 6.3.15  | `Intl.PluralRules` polyfill (Hermes lacks it) | Sep 2026    | 🟡 ~tens of KB; conditional     | —                    |
| `@formatjs/intl-locale`              | 5.3.12  | Dependency of the plural-rules polyfill       | Sep 2026    | 🟡                              | —                    |
| `@formatjs/intl-getcanonicallocales` | 3.2.12  | Dependency of the polyfills                   | Sep 2026    | 🟢                              | —                    |
| `react-native-restart`               | 0.0.29  | Restart to apply an RTL direction change      | Aug 2026    | 🟢 used rarely                  | Ask user to relaunch |

## Development (38)

| Package(s)                                                                                     | Purpose                             | Notes                                                     |
| ---------------------------------------------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------- |
| `typescript` ~6.0.3                                                                            | Type checking                       | TS 7 lacks the API typescript-eslint needs (DECISIONS §2) |
| `@react-native/{babel-preset,metro-config,typescript-config,jest-preset,eslint-plugin}` 0.87.1 | RN toolchain                        | Version-locked to RN                                      |
| `@react-native-community/cli*` 20.2.0                                                          | `run-android/ios`, autolinking      | Version-locked to RN template                             |
| `@babel/core`, `@babel/preset-env`, `@babel/runtime`                                           | Babel                               | Template defaults                                         |
| `babel-plugin-react-compiler` 1.0                                                              | Automatic memoisation               | Must be first plugin                                      |
| `babel-plugin-module-resolver`                                                                 | `@/` alias for Metro                | Mirrors tsconfig `paths`                                  |
| `@babel/plugin-transform-class-static-block`                                                   | Required by `@formatjs/intl-locale` | Release bundle fails without it                           |
| `@babel/plugin-transform-export-namespace-from`                                                | Required by zod 4                   | Release bundle fails without it                           |
| `eslint` 10, `@eslint/js`, `typescript-eslint`, `globals`                                      | Linting                             | Flat config                                               |
| `eslint-plugin-react-hooks` 7                                                                  | Hooks + React Compiler rules        |                                                           |
| `eslint-plugin-import-x`, `eslint-import-resolver-typescript`                                  | Import order, cycles, resolution    |                                                           |
| `eslint-plugin-boundaries` 7                                                                   | Architecture layering               |                                                           |
| `eslint-plugin-jest`, `eslint-plugin-testing-library`                                          | Test hygiene                        |                                                           |
| `eslint-config-prettier`, `prettier` 3                                                         | Formatting                          |                                                           |
| `jest` 29.7, `@types/jest`                                                                     | Test runner                         | Not 30 (RN preset resolver incompatibility)               |
| `@testing-library/react-native` 14, `test-renderer` 1.3                                        | Component tests                     |                                                           |
| `reassure` 1.6                                                                                 | Render-performance regression tests |                                                           |
| `lefthook`, `@commitlint/cli`, `@commitlint/config-conventional`                               | Git hooks, commit messages          |                                                           |
| `@types/react` ~19.2, `@types/node` 24                                                         | Types                               |                                                           |

Ruby (`Gemfile`): `cocoapods`, `xcodeproj` (template pins), `fastlane` (release lanes).

## Deliberately **not** included

| Package                           | Why not                                                                      | When to add                                           |
| --------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------- |
| Redux Toolkit                     | Server state is TanStack's; remaining client state is tiny                   | Many teams needing enforced patterns + time-travel    |
| axios / ky                        | `fetch` + 0.87 AbortSignal covers it; axios supply-chain incident (Mar 2026) | —                                                     |
| AsyncStorage                      | MMKV is sync and faster                                                      | A dependency requires it                              |
| SQLite / WatermelonDB             | Not needed for typical offline reads                                         | Relational/offline-first data → `op-sqlite` + Drizzle |
| `@gorhom/bottom-sheet`            | Incompatible types with RNGH 3; v6 stalled                                   | Use native `formSheet` presentation                   |
| Icon library / `react-native-svg` | Brand-specific                                                               | Add with the app's icon set                           |
| Push (RNFB, notification libs)    | Needs Firebase project files; Notifee archived                               | See COOKBOOK → push notifications                     |
| Expo modules                      | No Expo SDK targets RN 0.87                                                  | Upgrade to an RN version with a matching SDK          |
| Reactotron / Flipper              | Flipper is dead; RN DevTools + Rozenite cover debugging                      | Optional dev-only Rozenite plugins                    |
| Lodash / moment / date-fns        | `Intl`, `Date`, small utils in `shared/`                                     | A real need beyond `Intl`                             |

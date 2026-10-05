# Baseline — React Native foundation

> **New here? Start with the [Quick Guide](docs/QUICK_GUIDE.md)** — structure, first steps, creating screens and features, changing the server URL, in simple words.

The team's production baseline for new React Native apps: a bare **React Native 0.87** app (New Architecture, Hermes V1) with the infrastructure every app needs already wired, tested and documented — and nothing an app doesn't need.

| Layer        | Choice                                                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Runtime      | React Native 0.87.1 · React 19.2 · Hermes V1 · New Architecture · React Compiler 1.0                                    |
| Language     | TypeScript 6.0 strict                                                                                                   |
| Navigation   | React Navigation 7 (static API, native-stack, auth-gated groups, typed deep links)                                      |
| Server state | TanStack Query 5 (offline-aware, selective persistence)                                                                 |
| Client state | Zustand 5                                                                                                               |
| Networking   | Typed `fetch` client (timeouts, cancellation, single-flight token refresh, zod validation)                              |
| Storage      | MMKV 4 (sync KV) · Keychain/Keystore (secrets)                                                                          |
| UI           | Design system on StyleSheet + tokens · FlashList 2 · Reanimated 4 · Gesture Handler 3 · keyboard-controller · FastImage |
| Platform     | i18next (+ RTL) · Sentry (facade) · react-native-config (4 environments) · permissions · bootsplash                     |
| Quality      | ESLint 10 (architecture boundaries) · Prettier 3 · Jest 29 + RNTL 14 · Reassure · Maestro · lefthook + commitlint       |
| Delivery     | GitHub Actions CI · Fastlane → Play internal track / TestFlight                                                         |

## Quick start

Prerequisites: Node 24 (`.nvmrc`), Ruby + Bundler, Xcode 16.1+ (built and run with Xcode 27), Android Studio with SDK 37 / NDK 27, JDK 17. Follow the [RN environment setup](https://reactnative.dev/docs/set-up-your-environment) for your OS.

```bash
npm install
```

```bash
bundle install && npm run pods
```

```bash
npm run ios:dev
```

```bash
npm run android:dev
```

The dev environment uses an **in-app mock API** (`USE_MOCK_API=true` in `.env.development`): sign in with any email and the password `password`. Set it to `false` and `API_URL` to your backend when it's ready.

> **First-time repo setup:** `npm install` installs git hooks via lefthook (requires a git repository). npm 11 runs install scripts only for packages approved in `package.json → allowScripts`.

## Scripts

| Script                                                        | Does                                                                                 |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `start` / `start:reset`                                       | Metro (optionally clearing cache)                                                    |
| `android:{dev,qa,staging,prod}` · `ios:{dev,qa,staging,prod}` | Build & run an environment                                                           |
| `pods` · `ios:configure`                                      | CocoaPods install (+ env xcconfig generation) · re-create iOS configurations/schemes |
| `build:android` · `build:android:apk`                         | Production AAB / APK                                                                 |
| `validate`                                                    | typecheck + lint + format check + i18n parity + tests — run before pushing           |
| `test` · `test:coverage` · `test:perf`                        | Jest · with coverage thresholds · Reassure                                           |
| `e2e`                                                         | Maestro smoke flows (`.maestro/`)                                                    |
| `lint:fix` · `format`                                         | Auto-fix                                                                             |
| `clean`                                                       | Remove node_modules, Pods, builds, caches                                            |

## Project structure

```
src/
├── app/        composition root: bootstrap, providers, navigation, deep links
├── features/   vertical slices (auth, feed, settings) — screens, hooks, api, components
├── ui/         design system: theme tokens + accessible, themed, RTL-safe components
├── core/       infrastructure: api, auth, storage, config, i18n, errors, logger, monitoring, …
└── shared/     pure utils & types
```

Layers import downward only (`shared ← core ← ui ← features ← app`), features never import each other, and vendor SDKs are reachable only through their core module — **enforced by ESLint**. Details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Documentation

| Doc                                                               | Read it when                                                                                   |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md)                           | Onboarding; deciding where code goes; understanding data/auth/error flows; quality-gate review |
| [DECISIONS.md](docs/DECISIONS.md)                                 | Wondering _why_ a library was chosen (evidence + rejected alternatives + revisit triggers)     |
| [CODING_STANDARDS.md](docs/CODING_STANDARDS.md)                   | Writing or reviewing code                                                                      |
| [PERFORMANCE.md](docs/PERFORMANCE.md)                             | Building lists, animations, startup-sensitive code; profiling                                  |
| [DEPENDENCIES.md](docs/DEPENDENCIES.md)                           | Adding/upgrading a package                                                                     |
| [ENVIRONMENTS_AND_RELEASES.md](docs/ENVIRONMENTS_AND_RELEASES.md) | Env vars, signing, versioning, CI, releases, RN upgrades                                       |
| [COOKBOOK.md](docs/COOKBOOK.md)                                   | Adding a feature/screen/endpoint/language/permission/flag; push; encryption; renaming          |
| [MIGRATION_FROM_REFERENCE.md](docs/MIGRATION_FROM_REFERENCE.md)   | Moving the Sehanexis app (or a similar one) onto this baseline                                 |
| [AGENTS.md](AGENTS.md) · [AI/](AI/README.md)                      | Working with AI agents: their rules, routing, playbooks and per-project memory                 |

## Verification status

What has actually been run (Xcode 27 / iOS 27 simulator, Android API 37 emulator; last updated 2 Oct 2026):

- `npm run validate` — typecheck, lint (incl. architecture rules), format, i18n parity, 70 tests, coverage thresholds: **passing**
- Android `assembleDevDebug` and `assembleProdRelease` (R8, Hermes bytecode): **build**
- iOS `Debug-Dev` simulator build: **builds and runs**
- Manually exercised on iOS: sign-in → feed → detail → deep link → dark mode → Arabic RTL (restart) → English → sign-out, session restore across restarts
- Manually exercised on Android: sign-in (Keystore) → feed with images → infinite pagination
- Release JS bundle verified free of dev mock code and dev network/auth tooling
- Hardened from a real product build (an e-commerce app stress-tested on both platforms): RN-fetch timeout classification, sign-out store reset, deep-link conflict test, Gesture Handler test harness, persisted-store helper, list-screen keyboard handling (verified on iOS and Android), Dev Menu network simulation (offline verified on Android)

Not yet done: iOS release/archive build with signing, Maestro flows in CI, profiling on a physical low-end device. See ARCHITECTURE.md §6.

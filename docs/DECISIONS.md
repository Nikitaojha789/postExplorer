# Architecture Decision Record

Each decision lists the **choice**, the **evidence** behind it, the **alternatives** considered and why they lost, and the **revisit trigger** — the event that should reopen it. Research date: **1 October 2026** (npm registry, official docs, release notes, GitHub sources; several claims were verified by building and running this repository).

Legend: ✅ chosen · ⚖️ viable alternative · ❌ rejected

---

## 1. Framework: React Native Community CLI (bare), not Expo

|                  |                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Choice**       | ✅ `@react-native-community/cli` 20.2 init, RN **0.87.1**                                                                                                                                                                                                                                                                                                                                                               |
| **Evidence**     | reactnative.dev recommends a framework (Expo) for new apps but explicitly supports CLI when you "prefer to write your own Framework" — which is what an internal baseline is. Our reference project and team are CLI-based. Expo SDK 57 targets RN 0.86 and SDK 58 targets 0.88-rc; **no Expo SDK targets 0.87**, so Expo modules (expo-image, expo-secure-store) could not be adopted on this RN version without risk. |
| **Alternatives** | ⚖️ Expo (prebuild/CNG): better DX, EAS, config plugins — the right choice if the team wants managed native folders. ❌ Staying on 0.85 (reference): misses Hermes V1 maturity, Metro 0.87 source-map/memory wins, Strict TS API.                                                                                                                                                                                        |
| **Revisit**      | If the team adopts EAS Build/Update, or needs several Expo modules — `npx install-expo-modules` is incremental.                                                                                                                                                                                                                                                                                                         |

## 2. Language & compiler: TypeScript 6.0 (strict), React Compiler 1.0

|                  |                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Choice**       | ✅ `typescript ~6.0.3` (matches the RN 0.87 template), strict + `noUncheckedIndexedAccess` + `noImplicitOverride`. ✅ `babel-plugin-react-compiler` 1.0 (first Babel plugin).                                                                                                                                                                                                                |
| **Evidence**     | TS 7.0 (Go compiler) "does not ship with an API" until 7.1; `typescript-eslint` 8.71 peers `typescript <6.1`. TS 7 type-checks this repo, but type-aware lint needs the TS 6 API. React Compiler 1.0 is stable (react.dev, Oct 2025); verified it emits memo-cache code in a 0.87 release bundle and Jest passes. Its lint rules ship in `eslint-plugin-react-hooks` 7 (`flat.recommended`). |
| **Alternatives** | ⚖️ TS 7 for `tsc` + `@typescript/typescript6` alias for tooling (Bluesky/Expensify do this) — adds aliasing complexity for a ~10× faster typecheck; worth it at large scale. ❌ Manual `useMemo/useCallback` everywhere — the compiler does it consistently.                                                                                                                                 |
| **Revisit**      | TS 7.1 ships its API and typescript-eslint supports it.                                                                                                                                                                                                                                                                                                                                      |

## 3. JS engine & architecture: Hermes V1 + New Architecture

|                 |                                                                                                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Choice**      | ✅ Defaults: Hermes V1 (default since 0.84), New Architecture (mandatory since 0.82), precompiled iOS core.                                                                                                                     |
| **Evidence**    | RN 0.82/0.84/0.87 release posts. Legacy architecture is no longer compiled into iOS builds; JSC moved out of core in 0.81. "Static Hermes" AOT is not the default — not assumed.                                                |
| **Implication** | Every native dependency must support the New Architecture (bridgeless). Libraries were selected accordingly; the two legacy-API libraries (keychain 10, device-info 15) run via the interop layer and were verified at runtime. |

## 4. Navigation: React Navigation 7.5, static API, native-stack

|                  |                                                                                                                                                                                                                                                                                                                                                                |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Choice**       | ✅ `@react-navigation/native` 7.5 static configuration; `native-stack` for stacks; JS `bottom-tabs`; auth via `if:` groups; typed globally via `declare module … RootNavigator`.                                                                                                                                                                               |
| **Evidence**     | v8 is `8.0.0-alpha.49` (no beta date). Static API auto-generates types and deep-link paths. Native stack gives "smoother transitions and better performance" (docs). Native bottom tabs exist only under `bottom-tabs/unstable` ("may change in a minor release").                                                                                             |
| **Alternatives** | ❌ JS `@react-navigation/stack` (reference project): JS-thread transitions. ❌ Expo Router: requires Expo. ❌ React Native Navigation (Wix): separate native root per screen, smaller ecosystem. ⚖️ Dynamic API: more flexible, but hand-maintained `ParamList` types drift (the reference project's `RootStackParamList` had routes copied from another app). |
| **Revisit**      | React Navigation 8 stable (native tabs default, `.with()` for static config).                                                                                                                                                                                                                                                                                  |

## 5. Server state: TanStack Query v5

|                  |                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Choice**       | ✅ `@tanstack/react-query` 5.104 + async persister on MMKV (opt-in per query). Official RN recipe: NetInfo → `onlineManager`, AppState → `focusManager`, refetch on screen focus.                                                                                                                                                                                             |
| **Evidence**     | Caching, dedupe, cancellation, retries, pagination, offline pause/resume, persistence — the reference project re-implemented a fraction of this by hand in Redux (`loaded/loading/error` flags per slice, no staleness, no dedupe). `createSyncStoragePersister` is deprecated → async persister (accepts sync storage). Used by Bluesky, Obytes, thecodingmachine templates. |
| **Alternatives** | ⚖️ RTK Query — good if Redux is already the store. ❌ SWR — thinner mutation/offline story. ❌ Hand-rolled hooks — the reference project's problem.                                                                                                                                                                                                                           |

## 6. Client state: Zustand v5

|                  |                                                                                                                                                                                                                                                                            |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Choice**       | ✅ `zustand` 5.0.15 for the small global client state (session status, theme preference, flags, toasts).                                                                                                                                                                   |
| **Evidence**     | Once server state lives in TanStack Query, remaining global state is tiny. Zustand: ~1 KB, selector-based subscriptions (component re-renders only when its slice changes), callable outside React (needed by the HTTP client and session).                                |
| **Alternatives** | ⚖️ Redux Toolkit 2.13 — better when many contributors need enforced patterns and time-travel debugging; overkill here. ⚖️ Jotai 3 — finest-grained atoms; ESM-only and fresh major (Sep 2026). ❌ React Context for frequently-changing state — re-renders every consumer. |

## 7. Storage

| Need           | Choice                                                      | Why                                                                                                                     | Rejected                                                                                                                        |
| -------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Sync key-value | ✅ `react-native-mmkv` 4.3 (+ `react-native-nitro-modules`) | JSI/Nitro, synchronous (theme/lang read before first render), multi-instance (`app` survives sign-out, `user` is wiped) | ❌ AsyncStorage v3 — async-only, bridge-free but promise round-trips at startup                                                 |
| Secrets        | ✅ `react-native-keychain` 10.0                             | Keychain/Keystore (AES-GCM on Android), most adopted, verified working on 0.87 bridgeless (iOS + Android)               | ⚖️ `react-native-sensitive-info` 6 (Nitro, newer, less adoption) · ❌ `expo-secure-store` (needs Expo modules; no SDK for 0.87) |
| Database       | ❌ none in baseline                                         | TanStack cache on MMKV covers offline reads                                                                             | Opt-in: ⚖️ `op-sqlite` + Drizzle (very active) · ❌ WatermelonDB (last release Apr 2025, open bridgeless issues)                |

Note: keychain's TurboModule rewrite is merged but unreleased; watch for 10.1/11. MMKV encryption is not enabled by default because RN 0.87 has no `crypto.getRandomValues` to generate a key — see COOKBOOK for the opt-in.

## 8. Networking: typed `fetch` wrapper (no axios)

|                  |                                                                                                                                                                                                                                                                                                                             |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Choice**       | ✅ ~200-line `createHttpClient` over `fetch`: timeout + cancellation with RN 0.87's native `AbortSignal.timeout/any`, single-flight token refresh, error-envelope → `AppError`, zod validation, injectable transport (mocks/tests).                                                                                         |
| **Evidence**     | RN `fetch` and axios both run on the same XHR transport — axios adds bytes, not speed. RN 0.87 replaced the `abort-controller` polyfill with a spec implementation (`AbortSignal.any/timeout`), removing the main reason teams added libraries. axios had a supply-chain compromise (malicious 1.14.1/0.30.4, 31 Mar 2026). |
| **Alternatives** | ⚖️ ky 2 — nice API; RN not an official target and `searchParams` merge bug with RN's URLSearchParams (closed "not planned"). ❌ axios — redundant transport, supply-chain incident, interceptors encourage hidden global state.                                                                                             |

## 9. Lists: FlashList v2

|                  |                                                                                                                                                                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Choice**       | ✅ `@shopify/flash-list` 2.3.2; `FlatList`/`SectionList` banned by lint.                                                                                                                                                                |
| **Evidence**     | v2 is a New-Architecture rewrite with no size estimates required; ~2.8M weekly downloads; Shopify-backed; used by Expensify, Mattermost. Verified: smooth infinite pagination on Android emulator, memoised rows with stable callbacks. |
| **Alternatives** | ⚖️ Legend List v3 — pure JS, very active, strong for chat/bidirectional lists; single maintainer, no independent benchmarks. ❌ FlatList — the reference project didn't even use it (ScrollView + `.map`).                              |
| **Revisit**      | Release cadence slowed after June 2026 (CI work continues). If it stalls, Legend List is the drop-in candidate.                                                                                                                         |

## 10. Animation & gestures: Reanimated 4.7 + Worklets 0.13, Gesture Handler 3.3

- Reanimated 4.7 peers `react-native 0.86–0.88` and `react-native-worklets 0.13.x` — pinned together exactly. Worklets Babel plugin last.
- Gesture Handler 3 (May 2026): hook API (`usePanGesture`…), `GestureHandlerRootView` still required.
- Static feature flags left at defaults; enable `*_SYNCHRONOUSLY_UPDATE_UI_PROPS` only after profiling.
- ❌ `@gorhom/bottom-sheet` 5: types reference `SimultaneousGesture`, renamed in RNGH 3; v6 rewrite PR closed unmerged. Use native-stack `presentation: 'formSheet'` for sheets.

## 11. UI, styling & platform UX

| Concern         | Choice                                            | Notes                                                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Styling         | ✅ `StyleSheet` + typed tokens + `makeStyles`     | Zero dependencies; theme changes are rare so a re-render on switch is acceptable. ⚖️ Unistyles 3 (C++ updates without re-render) once RN 0.87 support is confirmed. ❌ NativeWind v5 (RC, "not for production").                                |
| Theme mechanism | ✅ `Appearance.setColorScheme` + `useColorScheme` | Native UI follows the in-app choice (verified with native alerts).                                                                                                                                                                              |
| Images          | ✅ `@d11/react-native-fast-image` 8.13            | Native Fabric component, SDWebImage/Glide caching, AVIF. Original `react-native-fast-image` was revived in Sep 2026 but is still a legacy view manager with very high release churn — watch it. ❌ expo-image (Expo modules + no SDK for 0.87). |
| Keyboard        | ✅ `react-native-keyboard-controller` 1.22        | Consistent cross-platform behaviour, frame-accurate animated values; core KAV is banned by lint.                                                                                                                                                |
| Splash          | ✅ `react-native-bootsplash` 7.3                  | Hidden from JS in `NavigationContainer.onReady` (no white flash).                                                                                                                                                                               |
| Edge-to-edge    | ✅ RN core `edgeToEdgeEnabled=true`               | `react-native-edge-to-edge` is no longer needed on 0.86+ (its own README).                                                                                                                                                                      |
| Safe areas      | ✅ `react-native-safe-area-context` 5.10          | Core `SafeAreaView` deprecated since 0.81 (banned by lint).                                                                                                                                                                                     |

## 12. Platform services

| Concern                              | Choice                                                                                 | Notes                                                                                                                                                                                                                                                    |
| ------------------------------------ | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Crash/perf monitoring                | ✅ `@sentry/react-native` 8.28 behind `core/monitoring`                                | Off without a DSN; uploads only with `SENTRY_AUTH_TOKEN`; `sendDefaultPii:false`. Avoid 8.17.0/8.17.1 (Android New-Arch + 16 KB page issues). ⚖️ Crashlytics (free, weaker JS symbolication), Datadog (full RUM).                                        |
| Env config                           | ✅ `react-native-config` 1.7.2 + zod-validated `env.ts`                                | Android flavors read `.env.*`; iOS per-configuration `ENVFILE` set by the Podfile (parallel-safe, no `/tmp/envfile`).                                                                                                                                    |
| Device info                          | ✅ `react-native-device-info` 15 (version/build only)                                  | Needed for `X-App-Version` and the About screen.                                                                                                                                                                                                         |
| Network status                       | ✅ `@react-native-community/netinfo` 12                                                | Single source for TanStack `onlineManager` + offline pill.                                                                                                                                                                                               |
| Permissions                          | ✅ `react-native-permissions` 5.6                                                      | Just-in-time flow helper; only `Notifications` compiled in by default.                                                                                                                                                                                   |
| i18n                                 | ✅ i18next 26 + react-i18next 17 + `react-native-localize` 3.7 + `@formatjs` polyfills | Hermes still lacks `Intl.PluralRules` (facebook/hermes#1462).                                                                                                                                                                                            |
| RTL restart                          | ✅ `react-native-restart` 0.0.29                                                       | Only to apply a direction change; RN docs: `forceRTL` applies "on the next application start".                                                                                                                                                           |
| Push notifications                   | ⏸ Opt-in (not installed)                                                               | Notifee archived (Apr 2026). Recommended: RNFB v26 messaging (modular API, New-Arch only) for transport + `react-native-permissions` for the prompt + expo-notifications (needs Expo modules) or `react-native-notify-kit` for local/foreground display. |
| Background tasks                     | ⏸ Opt-in                                                                               | OS-throttled (~15 min). `expo-background-task` (WorkManager/BGTaskScheduler) or `react-native-background-fetch` (MIT). Prefer push for anything time-sensitive.                                                                                          |
| Pinning / RASP / screenshot blocking | ⏸ Opt-in by risk profile                                                               | `react-native-ssl-public-key-pinning` (check activity), `jail-monkey`/freeRASP, FLAG_SECURE-based libraries.                                                                                                                                             |

## 13. Forms & validation: react-hook-form 7 + zod 4

- Uncontrolled inputs (minimal re-renders), `@hookform/resolvers` 5 supports zod 4 natively.
- zod 4 also validates API responses and stored data — one schema language end to end.
- `z.config({ jitless: true })`: zod's `new Function` fast path is interpreted (not JIT-compiled) on Hermes, so codegen costs startup without payoff. Benchmark on a low-end device before flipping.
- Requires `@babel/plugin-transform-export-namespace-from` (found when the release bundle failed).
- ❌ yup (reference): slower, last release Sep 2025. ⚖️ TanStack Form v1 (fine; smaller ecosystem). ⚖️ valibot (smaller bundle; bundle size matters less with Hermes bytecode).

## 14. Testing

| Layer        | Choice                                         | Notes                                                                                                             |
| ------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Runner       | ✅ Jest **29.7** + `@react-native/jest-preset` | Jest 30's resolver lacks `packageFilter` that the RN 0.87 preset uses; Expensify/Bluesky/Mattermost stay on 29.7. |
| Components   | ✅ RNTL 14 + `test-renderer` 1.3               | v14: async `render`/`fireEvent`, React-Test-Renderer removed.                                                     |
| Render perf  | ✅ Reassure 1.6                                | Baseline on `main`, compare on PR (CI job).                                                                       |
| E2E          | ✅ Maestro flows (`.maestro/`)                 | Black-box, `testID` selectors, no New-Arch coupling. ⚖️ Detox (grey-box, less flaky) officially lists RN ≤0.84.   |
| Native mocks | One `jest.setup.ts`                            | Library-provided mocks where they exist; Nitro stubbed for MMKV's in-memory mock.                                 |

## 15. Tooling

| Tool               | Choice                                  | Evidence                                                                                                                                                                                                                                                                                                                                    |
| ------------------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ESLint             | ✅ **10.11**, hand-composed flat config | ESLint 9 is end-of-life (npm deprecation notice). `@react-native/eslint-config` still bundles plugins that call APIs removed in ESLint 10, so we compose `typescript-eslint`, `react-hooks` 7 (incl. compiler rules), `@react-native/eslint-plugin`, `import-x`, `boundaries` 7, `jest`, `testing-library` — all declare ESLint 10 support. |
| Architecture rules | ✅ `eslint-plugin-boundaries` 7         | Layer + feature-isolation + entry-point rules in one policy list (v7 `dependencies` rule; deprecated `entry-point` rule avoided).                                                                                                                                                                                                           |
| Formatting         | ✅ Prettier 3.9                         |                                                                                                                                                                                                                                                                                                                                             |
| Git hooks          | ✅ lefthook 2.1 + commitlint 21         | Parallel, staged-file hooks; no `prepare` script; used by Expensify and Callstack. Husky 9 is stable but unpublished since Nov 2024.                                                                                                                                                                                                        |
| Package manager    | ✅ npm 11 (template default)            | npm 11 `allowScripts`: install scripts run only for approved, version-pinned packages (supply-chain hardening). ⚖️ pnpm with `nodeLinker: hoisted`.                                                                                                                                                                                         |
| Node               | ✅ 24 LTS (`.nvmrc`), engines `^22.22   |                                                                                                                                                                                                                                                                                                                                             | >=24.3` | RN 0.87 needs ≥22.13; lint-staged-class tools need ≥22.22. |

## 16. CI/CD & releases

- GitHub Actions: quality (typecheck/lint/format/i18n/tests+coverage/npm audit), Reassure on PRs, Android + iOS compile checks with Gradle/ccache/Pods caches.
- Release: manual `workflow_dispatch` → Fastlane → Play internal track (AAB) / TestFlight (match signing, App Store Connect API key). Build number = CI run number; marketing version = `package.json` version (single source of truth for Android `versionName` and iOS `MARKETING_VERSION`).
- ❌ CodePush: App Center retired 31 Mar 2025, repos archived. OTA options for later: expo-updates (EAS or self-hosted), hot-updater, Revopush.

---

## Supply-chain & maintenance policy

1. Native modules are pinned **exactly**; JS libraries use caret ranges; the lockfile is what CI installs (`npm ci`).
2. `allowScripts` in `package.json` whitelists install scripts per exact version — upgrading one of those packages requires re-approval (`npm install-scripts approve <pkg>`).
3. Dependabot groups related packages; React Native itself is upgraded deliberately with the Upgrade Helper, one minor at a time, following RN's support window (latest + 2 previous minors).
4. Every new dependency needs a row in DEPENDENCIES.md (purpose, maintenance evidence, alternatives) in the same PR.

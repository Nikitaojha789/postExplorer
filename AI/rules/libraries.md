# Dependencies, libraries and hallucination traps

Inventory with reasons and alternatives: `docs/DEPENDENCIES.md`. Choices and rejected options: `docs/DECISIONS.md`. Adding, removing or upgrading any package is a **hard stop** — propose it, don't do it.

## 1. Before proposing a new package

Answer all of these in the proposal:

1. Can existing code do it — `@/core`, `@/ui`, `@/shared`, the platform, or `Intl` — in under ~100 lines?
2. Is it already rejected in `docs/DEPENDENCIES.md` → "Deliberately not included"?
3. Does it support the **New Architecture** and RN 0.87 (Fabric/TurboModules/Nitro; not interop-only if avoidable)?
4. Released in the last 6 months; real maintainers; reasonable issue backlog?
5. Bundle size and startup cost; native binary size for native modules?
6. Does it need Expo modules? (No Expo SDK targets RN 0.87 — treat as unavailable.)

## 2. Adding a package (after approval)

1. Install with an exact version for native modules (`npm install <pkg>@<x.y.z> --save-exact`); JS-only packages may use `^`.
2. If npm asks to run an install script, review it, then approve it explicitly (`allowScripts` in `package.json`).
3. Native module: `npm run pods`; add its Jest mock to `jest.setup.ts` (prefer the library's official mock).
4. Vendor SDK: wrap it in one `src/core/<module>/` facade and add it to `VENDOR_OWNERS` in `eslint.config.mjs`, so only that module can import it.
5. Add a row to `docs/DEPENDENCIES.md` and update §3 below.
6. Verify: `npm run validate`, both platform builds, and a release bundle (`AI/playbooks/native-change.md` §4).

**Upgrades:** one package (or one tightly coupled group) per change; read its changelog and breaking changes; check the RN-compatibility range (Reanimated/Worklets pin tightly). React Native upgrades follow `docs/ENVIRONMENTS_AND_RELEASES.md` §9. **Removal:** prove it's unused by search, remove its mock, `VENDOR_OWNERS` entry, docs row and pods.

## 3. Installed stack — use these, at these versions

| Concern        | Package (version)                                                                  | Import through                     |
| -------------- | ---------------------------------------------------------------------------------- | ---------------------------------- |
| Runtime        | `react-native` 0.87.1, `react` 19.2.3                                              | —                                  |
| Language       | TypeScript ~6.0, React Compiler 1.0                                                | —                                  |
| Navigation     | `@react-navigation/native` 7 (static API), `native-stack`, `bottom-tabs`           | `app/navigation` only              |
| Server state   | `@tanstack/react-query` 5.104 (+ persist client)                                   | feature hooks; `@/core/api`        |
| Client state   | `zustand` 5                                                                        | —                                  |
| Validation     | `zod` 4.6                                                                          | —                                  |
| Forms          | `react-hook-form` 7 + `@hookform/resolvers` 5                                      | —                                  |
| HTTP           | in-house `http` (fetch)                                                            | `@/core/api`                       |
| Storage        | `react-native-mmkv` 4 (+ `react-native-nitro-modules`), `react-native-keychain` 10 | `@/core/storage`                   |
| Lists          | `@shopify/flash-list` 2                                                            | direct                             |
| Images         | `@d11/react-native-fast-image` 8                                                   | `<Image>` from `@/ui`              |
| Animation      | `react-native-reanimated` 4.7 + `react-native-worklets` 0.13                       | direct                             |
| Gestures       | `react-native-gesture-handler` 3                                                   | direct                             |
| Keyboard       | `react-native-keyboard-controller` 1.22                                            | `<Screen avoidKeyboard>` or direct |
| i18n           | `i18next` 26, `react-i18next` 17, `react-native-localize`                          | `@/core/i18n`                      |
| Config         | `react-native-config`                                                              | `env` from `@/core/config`         |
| Monitoring     | `@sentry/react-native` 8                                                           | `@/core/monitoring`                |
| Network status | `@react-native-community/netinfo`                                                  | `@/core/network`                   |
| Permissions    | `react-native-permissions` 5                                                       | `@/core/permissions`               |
| Splash         | `react-native-bootsplash` 7                                                        | `app/navigation` only              |
| Tests          | Jest 29, RNTL 14, Reassure, Maestro                                                | `@test/render`                     |

**Not installed — don't import:** axios, AsyncStorage, Redux/RTK, moment, lodash, date-fns, `@react-navigation/stack`, `react-native-svg`, any icon library, any Expo module, `@gorhom/bottom-sheet`, Firebase, Notifee, WebView. Each needs the §1 process (several are rejected on purpose).

## 4. Hallucination traps — read before touching the library

**React Native 0.87**

- `InteractionManager` is removed → `requestIdleCallback` or the navigation `transitionEnd` event.
- `SafeAreaView` from `react-native` is deprecated → `<Screen>` or `useSafeAreaInsets()`.
- RN's `fetch` rejects every abort with a plain `AbortError` — the abort _reason_ (`AbortSignal.timeout`) is lost. The HTTP client classifies timeouts itself; don't rely on `signal.reason` in features.
- Bare app: no `expo-*` imports, no `app.config.js`, no `npx expo install`.
- `console.*` output shows in React Native DevTools, not the Metro terminal.

**React 19.2 / React Compiler**

- Pinned to 19.2.3 by RN 0.87 — never bump to 19.3.
- Compiler rules: no mutation of props/state, no reading refs during render, no setState in render.

**TypeScript 6** — stays below 7 (typescript-eslint needs the TS 6 API).

**React Navigation 7 (static API)**

- Routes are declared in `createNativeStackNavigator({ screens/groups })` — not JSX `<Stack.Screen>` (dynamic API).
- Types are global (`declare module '@react-navigation/native'` in `RootNavigator.tsx`): call `useNavigation()` with **no** generic; screen params via `StaticScreenProps<{ id: string }>`. Don't create `RootStackParamList` types.
- Auth gating via `if:` groups — no `navigation.reset` after sign-in/out.
- Every screen needs an explicit `linking` path; a missing one gets `''` and breaks all deep links.
- `native-stack` options differ from the JS stack's (no `cardStyle`, `cardStyleInterpolator`).

**TanStack Query 5**

- Object syntax only: `useQuery({ queryKey, queryFn })`.
- `isPending` (no data yet) vs `isFetching`; `gcTime` (not `cacheTime`); `placeholderData: keepPreviousData` (not `keepPreviousData: true`).
- `useQuery` has no `onSuccess`/`onError`/`onSettled` callbacks — use the mutation's, the global cache's, or derive in render.
- Infinite queries require `initialPageParam`.

**Zustand 5**

- `import { create } from 'zustand'` (no default export), curried `create<T>()(…)`.
- A selector returning a new object or array loops renders → `useShallow` from `zustand/react/shallow`.

**zod 4**

- Top-level formats: `z.email()`, `z.url()`, `z.uuid()` (`z.string().email()` is deprecated).
- Custom messages: `{ error: '…' }` or a string; this codebase passes i18n keys.
- `z.config({ jitless: true })` is set in `polyfills.ts` on purpose (Hermes) — keep it.

**MMKV 4** (only inside `core/storage`) — `createMMKV({ id })`, not `new MMKV()`; `.remove(key)`, not `.delete(key)`.

**Reanimated 4 + Worklets**

- Babel plugin is `react-native-worklets/plugin` and must be **last**; React Compiler must be **first**.
- `runOnJS` / `runOnUI` are deprecated → `scheduleOnRN` / `scheduleOnUI` from `react-native-worklets`.
- No Reanimated 1/2 APIs (`useAnimatedGestureHandler`, `Animated.Value` from Reanimated).

**Gesture Handler 3**

- Hook API: `usePanGesture`, `useTapGesture`, … with `<GestureDetector>`. The `Gesture.Pan()` builder is deprecated.
- Needs `GestureHandlerRootView` at the root (already in `App.tsx` and `renderWithProviders`).

**FlashList 2** — no `estimatedItemSize` (v1 prop, removed). Use `getItemType` for mixed rows.

**FastImage** — the package is `@d11/react-native-fast-image`, but you never import it: use `<Image>` from `@/ui` (`preloadImages`, `clearImageCaches` live there too).

**keyboard-controller** — `KeyboardProvider` is already mounted. Use `<Screen avoidKeyboard>` or this library's components, never React Native's `KeyboardAvoidingView` (🔒 banned).

**i18n** — Hermes lacks `Intl.PluralRules`; the `@formatjs` polyfills in `polyfills.ts` are required. Change language only with `changeLanguage` from `@/core/i18n`.

**Testing** — Jest 29, not 30 (RN preset incompatibility). RNTL 14: `render`/`renderWithProviders` and `fireEvent` are async; use `userEvent.setup()`. Matchers like `toBeOnTheScreen()` are built in — don't install `@testing-library/jest-native`.

**Babel** — `@babel/plugin-transform-class-static-block` and `export-namespace-from` are needed for release bundles (`@formatjs`, zod). Don't remove them because debug builds work without them.

> Found a new trap? Add one line here in the same PR as the fix.

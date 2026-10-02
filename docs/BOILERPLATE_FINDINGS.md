# Baseline boilerplate: findings from the Buyza stress test

**Purpose:** a work list for fixing the boilerplate. Each item was found while building and running Buyza, an e-commerce app on the DummyJSON API. Generic best practices and anything not seen during testing are left out.

**Tested on:** iOS 27 simulator (iPhone 18 Pro, Debug); Android 17 emulator (Pixel 10 arm64, Debug); Jest/RNTL/Reassure (28 suites, 101 tests).

## How to use this document

- Buyza's first commit, `a3222e6`, is the unmodified boilerplate. The `src/...` paths below are therefore the same in the boilerplate repo.
- **Reference implementation:** most items are already fixed in Buyza. You can read the fix or diff it directly:
  ```bash
  git -C /Users/pankaj/Developer/Projects/Learning/Buyza diff a3222e6 -- src/core/api/httpClient.ts
  ```
  Buyza root: `/Users/pankaj/Developer/Projects/Learning/Buyza`. Untracked new files (e.g. `src/core/storage/persistedStore.ts`) can be read directly.
- **Port the platform part only.** Leave out the e-commerce code, the DummyJSON specifics and the Stress Lab feature, unless an item says otherwise.
- **Status:** **Fixed in Buyza** means a working fix exists to port. **Open** means it is not fixed anywhere yet.

## Summary

| ID  | Severity | Area                | Finding                                                                          | Status         |
| --- | -------- | ------------------- | -------------------------------------------------------------------------------- | -------------- |
| H1  | High     | `core/api`          | On Android, a request timeout is reported as `cancelled`, so it is never retried | Fixed in Buyza |
| H2  | High     | `core/auth`         | After sign-out, in-memory stores write the previous user's data back to storage  | Fixed in Buyza |
| H3  | High     | Reference feature   | The reference feed's `maxPages` cannot reload evicted pages                      | Fixed in Buyza |
| H4  | High     | Navigation          | Deep links can all break at runtime, and no test catches it                      | Fixed in Buyza |
| H5  | High     | Test harness        | The first screen with a Gesture Handler gesture breaks every screen test         | Fixed in Buyza |
| M1  | Medium   | Test harness        | Unit tests can silently make real network calls                                  | Open           |
| M2  | Medium   | `ui/Image`          | `width`/`height` are missing from the `Image` style type under RN 0.87           | Fixed in Buyza |
| M3  | Medium   | `core/storage`      | No helper for persisted, validated Zustand stores                                | Fixed in Buyza |
| M4  | Medium   | `core/i18n`         | Language switching cannot be turned off by configuration                         | Fixed in Buyza |
| M5  | Medium   | `ui`                | Missing primitives: Skeleton, Section, Chip, Badge, horizontal chip row          | Fixed in Buyza |
| M6  | Medium   | `ui/Screen`         | No keyboard handling for list screens                                            | Partly fixed   |
| M7  | Medium   | ESLint              | Two pairs of lint rules contradict each other                                    | Open           |
| M8  | Medium   | Dev tooling         | Offline and bad-network states can't be tested on simulators                     | Fixed in Buyza |
| L1  | Low      | `core/logger`       | Dev logger shows a LogBox toast for every failed request                         | Open           |
| L2  | Low      | Jest config         | Coverage counts `*.perf-test.tsx` files as untested source                       | Fixed in Buyza |
| L3  | Low      | Navigation and docs | No pattern for guest browsing with sign-in on demand                             | Fixed in Buyza |
| L4  | Low      | Docs                | Cross-feature composition and React Compiler lint workarounds are undocumented   | Open           |

---

## High

### H1: On Android, a request timeout is reported as `cancelled`

**Found:** I ran the Stress Lab "Timeout" fault on the Android emulator. The result was `cancelled`, where `timeout` was expected. Every unit test passed, because the test `fetch` mocks reject with `signal.reason`; the real React Native `fetch` does not.

**Two causes:**

1. **The main cause: React Native's `fetch` (whatwg-fetch) rejects every abort with a generic `AbortError`.** It drops the signal's reason, so a `TimeoutError` from `AbortSignal.timeout()` reaches `toAppError` as an `AbortError` and is classified as `cancelled`.
   - **Effect:** TanStack Query does not retry it (only transient errors are retried).
   - **Effect:** the screen does not show the "request took too long" message. A `cancelled` result is treated as "not a failure".
2. **A secondary cause in `toAppError` (`src/core/errors/AppError.ts`).** Abort reasons are DOMExceptions. When they come from another realm or a polyfill, `instanceof Error` is false, so `toAppError` returned `unknown` instead of `timeout`/`cancelled`.

**Required:**

- `src/core/api/httpClient.ts`, in `send()`: wrap the `fetchImpl` call in a try/catch.
  - If `timeoutSignal.aborted && !signal?.aborted`, throw `AppError({ kind: 'timeout', … })`.
  - Otherwise rethrow.
  - The client owns `timeoutSignal`, so it can tell a timeout from a caller abort without relying on the error's reason.
- `src/core/errors/AppError.ts`: classify objects that are not `Error` instances by `name` (`TimeoutError` → `timeout`, `AbortError` → `cancelled`).
- Any `fetch` wrapper that re-throws `signal.reason` (as Buyza's `networkConditions.ts` `abortReason()` does) must keep the `name`.

**Done when:**

- A test with an RN-like fetch (one that rejects every abort with a plain `AbortError`) shows:
  - a timeout → `kind: 'timeout'`, and `isRetryable` is true;
  - a caller abort → `cancelled`.
- Buyza's tests are in `src/core/api/httpClient.test.ts` (`describe('abort classification …')`) and `src/core/errors/AppError.test.ts`.

### H2: After sign-out, in-memory stores write the previous user's data back

**Found:** while building the cart and wishlist (Zustand stores persisted to `userStorage`).

- `endSession()` wipes `userStorage`. The Zustand stores in memory still hold the old user's state.
- On their next update, they persist it back into the storage that was just cleared. The next user, or a guest, then inherits the previous user's cart.

**Required:**

- `src/core/auth/session.ts`: add `onSessionEnded(listener): unsubscribe`.
- Call every listener from `endSession()`, **each inside its own try/catch**, so one failing store can't block sign-out.
- Export it from `core/auth`.
- Document in the cookbook that any store holding user data must register a reset.

**Done when:**

- A unit test shows that listeners run on `endSession()` and that a listener which throws doesn't stop the others. Buyza has **no** core-level test for this yet; write one.
- The cookbook's persisted-store recipe (M3) includes the reset.

### H3: The reference feed's `maxPages` can't reload evicted pages

**Found:** while porting the reference `features/feed` pattern to the product grid.

- **The bug in the boilerplate:** `src/features/feed/hooks/useFeed.ts` sets `maxPages: 10` but has no `getPreviousPageParam`. Once a page is evicted, it can never be fetched again when the user scrolls back up.
- **Even a correct implementation misbehaved on device.** Buyza's version (bidirectional, with `getPreviousPageParam` and FlashList `onStartReached`) still made the scroll position **jump on device** when leading pages or header rows were evicted. Buyza ships it behind a `boundedPagination` flag, off by default.

**Required:**

- Remove `maxPages` from the reference feature.
- Document `maxPages` as a recipe for truly unbounded feeds only. The recipe should:
  - require `getPreviousPageParam` and `onStartReached`;
  - warn about the scroll jump.
- For bounded datasets, don't cap pages at all. For scale: the whole DummyJSON catalogue of 194 products, as trimmed list summaries, is about 60 KB.

**Done when:** no reference code uses `maxPages` without `getPreviousPageParam`, and `docs/PERFORMANCE.md` or `docs/COOKBOOK.md` states when to use it.

### H4: Deep links can all break at runtime, and no test catches it

**Found:** on the iOS simulator, every deep link failed. App startup and all tests were fine.

- **Cause:** with `linking: { enabled: 'auto' }`, React Navigation gives the first screen of a navigator group that has no explicit path the path `''`. That collides with `Main`.
- **When it happens:** as soon as a group such as `SignedIn` or `SignedOut` gets a screen without a `linking` path.
- **Why it wasn't caught:** the error only appears when a link is opened.

**Required:**

- Make it a convention, and say so in the navigator's comments, that every screen declares an explicit `linking` path.
- Add `src/app/navigation/linking.test.ts`. It builds the config with `createPathConfigForStaticNavigation(RootStack, {}, true)` (the same `auto` mode the app uses). It then resolves the key paths with `getStateFromPath`, checking both the leaf screen and its params.

**Done when:** the test is in the boilerplate and covers every screen in the reference app. Adding a screen without a path should make it fail.

### H5: The test harness breaks on the first Gesture Handler gesture

**Found:** I added the first gesture (swipe-to-delete with the Gesture Handler 3 hook API). Every screen test in the suite then failed.

- **Cause 1:** `renderWithProviders` (`test/render.tsx`) claims to use "the app's real providers" but has no `GestureHandlerRootView`.
- **Cause 2:** on import, Gesture Handler 3 installs UI-runtime bindings through a microtask, and the real Worklets runtime throws under Jest.

**Required:**

- `test/render.tsx`: wrap the providers in `<GestureHandlerRootView style={{ flex: 1 }}>`.
- `jest.setup.ts`: add `jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));`.

**Done when:** a screen test that renders a component using `usePanGesture` + `GestureDetector` passes. Add one to the boilerplate's sample tests.

---

## Medium

### M1: Unit tests can silently make real network calls (Open)

**Found:** a hook lived in the same module as its API object, so it closed over the real client. `jest.mock('../api/accountApi')` therefore didn't apply to it.

- The test made a live network call.
- It took about 35 seconds of timeouts and then failed with a confusing error.

**Required:**

- In `jest.setup.ts`, replace the global `fetch` with one that throws a clear error (e.g. "Unmocked network request: <url>"), so a request that isn't mocked fails immediately.
- Document the rule "hooks live in `hooks/`, never in the same module as the endpoint object" in the cookbook's feature recipe.

**Done when:** a test that forgets to mock an API fails at once and names the URL.

### M2: `ui/Image` loses `width`/`height` from its style type under RN 0.87

**Found:** typecheck. FastImage's `ImageStyle` extends RN's `FlexStyle`, which no longer resolves under RN 0.87's strict types, so `width` and `height` silently disappear from the prop type. The boilerplate only compiled because its own styles happened to set other properties.

**Required:**

- In `src/ui/components/Image.tsx`, type the public `style` prop with RN's own `ImageStyle`.
- Cast it once at the FastImage boundary (`style as StyleProp<FastImageStyle>`).
- Also export the two helpers testing actually used:
  - `preloadImages(urls)`, used to prefetch on press-in;
  - `clearImageCaches({ disk })`, used for cache testing and as a sign-out option.

**Done when:** `<Image style={{ width: 100, height: 100 }} />` typechecks with no other style properties set.

### M3: No helper for persisted, validated Zustand stores

**Found:** five stores needed MMKV persistence (cart, orders, wishlist, recent searches, a device-level dev toggle). The boilerplate offers no pattern, so each would have had to wire `persist` by hand and trust whatever is in storage.

**Required:**

- Add `validatedPersistOptions({ key, store, schema, partialize, version })` in `src/core/storage/persistedStore.ts`. It should:
  - use `createJSONStorage` over the MMKV adapter;
  - check rehydrated data with a zod schema;
  - fall back to the initial state, and log a warning, when validation fails.
- MMKV is synchronous, so the store hydrates during `create()`. That means no `hasHydrated` workaround and no empty-cart flash on first render.
- Document in the cookbook when to use `userStorage` vs `appStorage`, and include the H2 reset.

**Done when:** the helper is exported from `core/storage`, and a test covers valid rehydration, rejected (corrupt) data, and a version mismatch (Buyza: `persistedStore.test.ts`).

### M4: Language switching can't be turned off by configuration

**Found:** the brief required language switching to be disabled. Doing that touched 6 files:

| File                                    | Change needed                                                          |
| --------------------------------------- | ---------------------------------------------------------------------- |
| `core/i18n/languages.ts`                | Remove the language                                                    |
| `core/i18n/resources.ts`                | Remove it from the bundle                                              |
| `core/i18n/i18n.ts`                     | Stop detection, which would otherwise pick a stored or device language |
| `app/bootstrap/polyfills.ts`            | Remove the `ar` plural data                                            |
| `scripts/check-i18n.mjs` (parity check) | Stop it requiring every new key to be translated into `ar`             |
| `features/settings/SettingsScreen.tsx`  | Hide the picker                                                        |

Without the detection change, a device set to Arabic would still switch to RTL and force a restart.

**Required:**

- One gate, `LANGUAGE_SWITCHING_ENABLED` in `languages.ts`. When it is false:
  - `detectLanguage()` returns `DEFAULT_LANGUAGE`;
  - `changeLanguage()` does nothing (it logs and returns `false`);
  - the Settings picker is hidden.
- A documented "parked locale" location (Buyza uses `locales/disabled/`) that is left out of both the bundle and the parity check.
- The re-enable steps written in the `languages.ts` header (see Buyza's version).

**Done when:** a single change turns language switching off without editing translations, and nothing user-visible shows any language option.

### M5: Missing UI primitives

**Found:**

- `StateView`'s docs say "prefer skeletons", but there was no `Skeleton` component.
- `Section` was a private copy-paste in `SettingsScreen` and was needed again in Account.
- Chips, badges and steppers were each needed on 2 or more screens.

**Required:** add these to `src/ui/components/`:

- **`Skeleton`.** A Reanimated 4 CSS animation that runs on the UI thread.
- **`Section`.** Replace the private copy in Settings.
- **`Chip`** and **`Badge`.**
- **`QuantityStepper`** is optional; it is fairly commerce-specific.
- **A horizontal chip row:** either a `ChipRow` component or a documented style rule. A device-only layout bug came from this:
  - React Native's `ScrollView` defaults to `flexGrow: 1`.
  - A horizontal chip `ScrollView` placed directly in a flex column took a share of the screen height and stretched each chip into a tall pill.
  - It looked correct in one place (inside a list row) and broken in another (the category screen). Jest didn't catch it, because Jest has no real layout.
  - The fix is `style={{ flexGrow: 0, flexShrink: 0 }}` on the `ScrollView`. Buyza: `src/features/catalog/components/SortBar.tsx`.

**Done when:** these are exported from `@/ui`, Settings uses the shared `Section`, and `StateView`'s skeleton advice points at a real component.

### M6: No keyboard handling for list screens (partly fixed)

**Found:** on the Search screen, results scrolled under the keyboard. Keyboard avoidance only exists for `Screen preset="scroll"` (a `KeyboardAwareScrollView`). The boilerplate itself says never to put a FlashList inside that preset, so list screens get no keyboard handling at all.

**What Buyza did:** `automaticallyAdjustKeyboardInsets` on the results list. That prop is **iOS only**, and the Android behaviour wasn't checked.

**Required:**

- A documented, cross-platform way to handle the keyboard on a screen built around a virtualized list. For example, keyboard-controller's insets applied to the list's content inset or bottom padding.
- Expose it from `Screen` or from a list helper.

**Done when:** on both iOS and Android, the last result in a search-style list can be scrolled above the open keyboard.

### M7: Two pairs of lint rules contradict each other (Open)

**Found:** `npm run lint` while writing features and tests.

1. `@typescript-eslint/non-nullable-type-assertion-style` auto-fixes `as T` into `x!`, which `@typescript-eslint/no-non-null-assertion` (`eslint.config.mjs:233`) then rejects. Running `--fix` produces new errors.
2. In RNTL 14, `fireEvent` is async. `testing-library/no-await-sync-events` forbids awaiting it, while `@typescript-eslint/no-floating-promises` requires awaiting it. Neither form passes lint.

**Required:**

- Turn off `non-nullable-type-assertion-style`.
- For tests, either turn off `testing-library/no-await-sync-events` or ban `fireEvent` in favour of `userEvent`, and update the sample tests to match.

**Done when:** `npm run lint -- --fix` leaves no errors behind, and a test that awaits `fireEvent.press` (or uses `userEvent`, if you choose that option) passes lint.

### M8: Offline and bad-network states can't be tested on simulators

**Found:**

- The boilerplate has `OfflineBanner`, paused queries and offline-paused mutations. Simulators can't easily drop connectivity, so none of these could be exercised.
- Slow or failing responses from a real backend couldn't be produced either.

**Required:** port the core of Buyza's tooling, but not the Lab screen.

- **`src/core/api/networkConditions.ts`.** `withNetworkConditions(fetch)` adds latency and a failure rate.
  - Simulated-offline requests fail fast.
  - Abort reasons are kept, with their `name`.
  - The cost when switched off is one store read per request.
- **`src/core/network/onlineManager.ts`.** `setSimulatedOffline(bool)` combines with NetInfo, so `onlineManager`, the banner and paused queries all behave as if the device were offline.
- **`src/core/auth`.** `expireAccessTokenForTesting()` replaces the access token in memory, so the 401 → single-flight refresh → retry path can be tested on demand.
- **Dev-only gating.** Gate all of this to `__DEV__` builds, or to a flagged diagnostics screen.

**Done when:** offline mode, added latency and a token-expiry burst can each be triggered on a simulator without touching the device's network.

**Optional:** Buyza's `features/lab/components/PerfMonitor.tsx` is a HUD showing JS FPS (via `requestAnimationFrame`), UI FPS (via a Reanimated frame callback) and Hermes heap. Every FPS and heap figure in this testing came from it. Anchor it bottom-right: at the top it covered the header titles.

---

## Low

### L1: The dev logger shows a LogBox toast for every failed request (Open)

**Found:** during fault injection on device. `consoleTransport` sends `warn` to `console.warn`, and `httpClient` logs every failed request at `warn`. Each failure therefore produced a LogBox toast, which covered parts of the UI under test.

**Required:** in `src/core/logger/logger.ts`, have `consoleTransport` send `warn` to `console.log`. Alternatively, tag the HTTP warnings and `LogBox.ignoreLogs` them.

### L2: Coverage counts `*.perf-test.tsx` as untested source

**Found:** `npx jest --coverage` reported the Reassure perf tests as 0%-covered source files, which pulled the coverage numbers down.

**Required:** add `'!src/**/*.perf-test.tsx'` to `collectCoverageFrom` in `jest.config.js`.

### L3: No pattern for guest browsing with sign-in on demand

**Found:**

- The boilerplate's navigator only supports hard gating: separate `SignedIn` and `SignedOut` trees.
- `SettingsScreen` always shows "Sign out", even to a guest.
- Letting guests browse and asking for sign-in only at checkout meant restructuring the navigator:
  - shared screens go in a group with no `if:`;
  - signed-in-only routes go in `SignedIn`;
  - the sign-in screen is a modal in `SignedOut`.
- When the session changes, React Navigation removes the modal and the user lands back where they were. That restructure is also what set off H4.

**Required:**

- Document this as an optional navigation recipe (Buyza: `src/app/navigation/RootNavigator.tsx`).
- Make `SettingsScreen` hide "Sign out" when there is no session (`useIsSignedIn()`).

### L4: Two patterns are undocumented (Open)

Both came up as friction while building:

- **Cross-feature composition.**
  - Features can't import each other, so the product screen got its add-to-cart bar through a render-prop slot (`renderPurchaseBar`), filled in `app/`.
  - The cart badge on the tab bar needed a small component in `app/` (`app/navigation/TabLabel.tsx`).
  - That works, but nothing documents it.
  - Separately, Checkout had to fetch the user profile again, because it couldn't use the Account feature's profile hook. Document the slot pattern. Optionally, decide whether a shared read model such as "current user profile" belongs in `core/`.
- **React Compiler purity lint.**
  - It flags `performance.now()` and `Date.now()` in event handlers declared inside a component body.
  - The fix is a timing or ID helper at module scope (Buyza: `features/lab/screens/LabScreen.tsx`). Add it to the cookbook.

---

## Verified to work: no change needed

Keep these as they are:

- **Layering.** 74 new source files across 4 new features, with no boundary violations and no import cycles.
- **`http` client + `AppError` + TanStack retry policy.** Every injected failure (4xx, 5xx, 429, network, parse/contract drift, offline) mapped to the right kind with no per-feature code. Timeout needed H1.
  - Android: server 500 in 191 ms, 429 → `rate_limited`, a 503 query retried twice and then failed after 3 attempts.
- **Single-flight token refresh.** Worked with DummyJSON's contract unchanged.
- **Zod at the API boundary.**
  - Caught DummyJSON's inconsistencies: `brand` missing on 92 of 194 products, and differently named cart fields.
  - Stripped personal fields (SSN, bank, crypto) before anything was cached.
- **FlashList v2 + FastImage.**
  - A 20,000-row image grid ran at 54–61 JS FPS and 60 UI FPS, with the Hermes heap flat at 68 MB (iOS Debug).
  - On Android Debug the UI thread held 60 FPS and the heap stayed flat (44 MB). JS FPS was lower (average 23), but it was a Debug build.
- **Zustand per-row selectors.** Toggling a wishlist heart causes one extra commit, and the grid doesn't re-render (Reassure).
- **Persisted query cache.** 35–42 KB in MMKV after a browsing session; the detail screen paints from the cached list summary.
- **Typed i18n keys** caught every missing string at compile time.
- **Local and root error boundaries** contained the injected widget crash.

## Not verified

These aren't findings. They're the limits of this testing, and they decide how far to trust the list above.

- **Release-build performance.** All FPS and heap figures are from Debug builds. I built a QA release APK (`release-apk/Buyza-qa-release-arm64.apk`) for a manual test on a physical device; its results aren't in this document.
- **Signed-in flows on a device:** sign-in, the cold-start `/auth/me` → refresh, checkout, order history, and the sign-out reset from H2. These are covered by unit and screen tests with mocked APIs only.
- **Maestro flows** were written but never run (Maestro isn't installed).
- **Android-specific gaps:** the M6 keyboard behaviour, and deep links on Android.
- **Dark mode** on device.

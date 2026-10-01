# Performance Playbook

Practical rules for keeping Baseline apps smooth on low-end Android and high-refresh-rate iPhones. Every rule says **why**, so you can tell when it doesn't apply. We don't promise "60/120 FPS" — we engineer for it and **measure**.

> Golden rule: **measure in release builds on a real low-end Android device.** Debug builds run un-optimised JS, extra checks and dev tooling — they can be 3× slower and mislead you. Android's `debugOptimized` variant is a useful middle ground for iteration.

---

## 1. Mental model: three threads

| Thread          | Runs                                                                                          | Blocks it →                                                             |
| --------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **JS** (Hermes) | React render, your logic, event handlers, `useAnimatedStyle` _setup_                          | Taps feel ignored, lists show blank cells, JS-driven animations stutter |
| **UI / main**   | Native views, layout commits, native-stack transitions, Reanimated worklets, gesture handling | Everything visibly janks, scroll stutters                               |
| **Background**  | Fabric layout (Yoga), image decoding, network                                                 | Content appears late                                                    |

Goal: keep the JS thread free during interactions, and run motion on the UI thread.

---

## 2. Rendering

**Do**

- Let the **React Compiler** memoise (it's on). Write plain components; avoid manual `useMemo/useCallback` unless profiling says so or you pass callbacks to `memo`'d list rows.
- Select the **smallest** store slice: `useSessionStore(s => s.status)`.
- Keep state as **low** in the tree as possible; lift only when shared.
- Derive values during render instead of syncing them into state with effects.
- Pass **stable** handlers to list rows: `onPress={openItem}` + `onPress(id)` inside the row (see `FeedItemRow`).
- Use `makeStyles` (styles created once per theme at module load).

**Don't**

- Put fast-changing values (scroll position, timers, form drafts) in context or global stores — every consumer re-renders.
- Create objects/arrays/functions inline in props of `memo`'d children when the compiler can't see the source (e.g., values from refs).
- Call `useStore()` without a selector, or return new objects from selectors without `useShallow`.
- Run expensive work in render. Move it to `select` (TanStack), a worker-style deferral, or the server.

**Measure:** React Native DevTools → Profiler (render counts, "Memo ✨" badges for compiled components) and Reassure (`npm run test:perf`).

---

## 3. Lists

- 🔒 **FlashList** for anything that scrolls and can grow (`FlatList`/`SectionList` are lint errors). Never `ScrollView` + `.map()` for unbounded data, and never nest a virtualised list inside a `ScrollView` (`Screen preset="scroll"`).
- Row components: `memo`, no inline closures per row, fixed-size images, no `useEffect` in rows, no layout-changing state on scroll.
- `keyExtractor` returns a stable id (never the index for dynamic data).
- Heterogeneous rows → `getItemType` so FlashList recycles like with like.
- Infinite lists: `onEndReached` guarded by `hasNextPage && !isFetchingNextPage`; `maxPages` caps memory for long sessions (feed uses 10).
- Keep per-row work tiny: format dates/numbers in `select` or once per item, not in every render.
- Chat / bidirectional lists: consider Legend List v3 (`KeyboardAwareLegendList`, `alignItemsAtEnd`).

---

## 4. Images

- 🔒 `<Image>` from `@/ui` (FastImage: memory + disk cache, Glide/SDWebImage).
- **Request the size you render.** Lists use thumbnails (`thumbnailUrl`, ~2× slot size); detail screens use the large rendition. A 1080px image in a 56px row decodes ~370× the pixels and is the #1 cause of list memory spikes on Android.
- Always give explicit dimensions; never rely on intrinsic size (causes re-layout).
- `priority="high"` only for above-the-fold heroes.
- Prefer WebP/AVIF from the CDN; ship local assets at @2x/@3x, not one huge file.
- Decorative images: `accessibilityLabel={null}`.

---

## 5. Animations & gestures

- Use **Reanimated 4** (UI-thread worklets, CSS-style transitions, layout animations). The core `Animated` API with `useNativeDriver` is acceptable for trivial opacity/transform.
- Animate **transform and opacity**; avoid animating `width/height/top/left/margin` (forces layout every frame).
- Never read a shared value on the JS thread in render (`sv.value` in JSX) — it synchronously crosses threads.
- Keep simultaneous animated components low on low-end Android (Reanimated docs: ~100 on low-end Android vs ~500 on iOS).
- Gestures: Gesture Handler 3 hook API; memoise gesture configs; do work in worklets, `runOnJS` only for the final result.
- Feature flags (`package.json → reanimated.staticFeatureFlags`) such as `ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS` only after profiling shows jank they address.
- iOS 120 Hz: `CADisableMinimumFrameDurationOnPhone` is already `true` in Info.plist.
- Respect **Reduce Motion** (`useReducedMotion` from Reanimated) for large movements.

---

## 6. Navigation

- `native-stack` everywhere (native transitions, off the JS thread). Don't swap in the JS stack for "custom" transitions without measuring.
- Defer heavy work until the transition ends: `navigation.addListener('transitionEnd')` or `requestIdleCallback` (`InteractionManager` was removed in RN 0.87).
- Tabs render lazily by default — keep it. Unfocused screens stay mounted: pause expensive subscriptions with `useIsFocused()` / TanStack `subscribed: isFocused`.
- Use `placeholderData` from the list cache so detail screens paint instantly (see `useFeedItem`).

---

## 7. Startup time

Startup = native init → JS bundle load → bootstrap → first render → first meaningful paint.

- Hermes **bytecode** is precompiled in release builds (no parse at launch).
- Metro **inline requires** are on by default: modules evaluate on first use. Keep module scope side-effect free so this works — no network calls, storage reads or heavy computation at import time (exceptions are explicit in `bootstrap.ts`).
- `bootstrap()` is synchronous and minimal; anything not needed for the first frame (prefetch, remote flags, analytics vendor init) runs **after** first render.
- Synchronous MMKV reads for theme/language avoid a flash and an extra render.
- The native splash stays until navigation is ready (`BootSplash.hide` in `onReady`) — perceived startup is smooth, not shorter: still measure TTI.
- `React.lazy` for rarely used heavy screens (e.g., a charting screen).
- Watch bundle size: `npx react-native bundle --platform android --dev false --minify true --entry-file index.js --bundle-output /tmp/main.jsbundle --sourcemap-output /tmp/main.map` then inspect with `source-map-explorer`. Current baseline: **~5.3 MB** minified JS before Hermes compilation.

Measure with Sentry app-start spans (cold/warm, TTID/TTFD) and Android Studio's **App Startup** profiling.

---

## 8. Network & caching

- `staleTime` 30s default — avoids refetch storms on back-and-forth navigation. Tune per query (static reference data: `Infinity`).
- Request only what the screen needs (pagination, field selection); paginate with cursors.
- Cancellation is automatic (TanStack `signal` → `http`): abandoned screens stop downloading.
- Persist only `meta: { persist: true }` queries — persisting the whole cache means a big `JSON.stringify` on the JS thread (throttled to 1/s).
- Prefetch on intent (`queryClient.prefetchQuery` on press-in) rather than eagerly.
- zod parse cost is linear in payload size; for very large lists consider validating a sample in production and everything in dev/QA.

---

## 9. Memory

- Cap infinite queries (`maxPages`), use thumbnails, avoid keeping big arrays in Zustand.
- Unsubscribe listeners in effect cleanups (NetInfo, AppState, `i18n.on`) — every `subscribe` in this codebase returns its cleanup.
- Clear timers (toast queue does).
- `userStorage.clearAll()` + `queryClient.clear()` on sign-out keep the next session lean (and private).

---

## 10. Android & low-end specifics

- Build release with **R8 + resource shrinking** (on) and ship an **AAB** so Play serves per-ABI splits.
- Test on a real ~2 GB RAM / 4-core device with **animations at 1×** and **"Profile HWUI rendering"** (Developer options) to see frame times.
- Avoid large `elevation`/shadow counts in lists; prefer borders or a single shadow per card.
- Text: avoid `adjustsFontSizeToFit` in lists (expensive measure).
- Edge-to-edge is on: always use safe-area insets; never hard-code status-bar heights.

---

## 11. Measuring — the routine

| When                | Tool                                                                                          | What to look at                                                                            |
| ------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Every PR            | **Reassure** (CI)                                                                             | Render count / duration regressions vs `main`                                              |
| Before each release | **Flashlight** (Android) driving a Maestro flow                                               | Average FPS, JS/UI thread CPU, RAM; compare with previous release                          |
| Investigating jank  | **React Native DevTools** → Performance panel                                                 | JS execution, React tracks, `performance.mark/measure` user timings (stable since RN 0.83) |
| Native hot spots    | Android Studio Profiler (System Trace / Perfetto), Xcode Instruments (Time Profiler, Hitches) | Main-thread stalls, layout, image decode                                                   |
| Production          | Sentry performance                                                                            | App start, slow/frozen frames, screen-load (TTID) per route                                |

Flashlight quick start (Android, release build installed). Install the CLI (docs.flashlight.dev):

```bash
curl https://get.flashlight.dev | bash
```

Run the Maestro smoke flow 10× (default) and record measures:

```bash
flashlight test --bundleId com.company.baseline.staging --testCommand "maestro test .maestro/flows/sign-in-and-browse.yaml" --duration 20000 --resultsFilePath results.json
```

```bash
flashlight report results.json
```

(The Maestro flows target the dev app id; change `appId` in the flow when profiling a staging build.)

Add your own marks around expensive work:

```ts
performance.mark('feed:transform:start');
// …work…
performance.measure('feed:transform', 'feed:transform:start');
```

---

## 12. Checklist for a performance-sensitive PR

- [ ] Profiled in a **release** build on a low-end Android device
- [ ] No new `ScrollView + map`, inline list closures, or unbounded state in context
- [ ] Images sized for their slot
- [ ] Animations on the UI thread (transform/opacity)
- [ ] Reassure test added/updated for new list or heavy screen
- [ ] No new work at module scope or in `bootstrap()`

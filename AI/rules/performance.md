# Performance rules

Why and how to measure: `docs/PERFORMANCE.md`. Target: smooth on a low-end Android phone, not just a simulator on a fast Mac.

## 1. Three threads

| Thread      | Runs                                                       | When blocked                                          |
| ----------- | ---------------------------------------------------------- | ----------------------------------------------------- |
| JS (Hermes) | React render, logic, handlers                              | Taps ignored, blank list cells, JS animations stutter |
| UI / main   | Native views, native-stack transitions, worklets, gestures | Everything janks                                      |
| Background  | Yoga layout, image decode, network                         | Content appears late                                  |

Keep the JS thread free during interactions; run motion on the UI thread.

## 2. Rendering

- Let the React Compiler memoise. No manual `useMemo`/`useCallback` without a profile — except stable callbacks for `memo` list rows.
- Smallest store selectors; state as low in the tree as possible; derive during render.
- No fast-changing values (scroll offset, timers, drafts) in context or global stores.
- No expensive work in render → TanStack `select`, a module-level helper, or the server.
- Styles via `makeStyles` (built once per theme).

## 3. Lists

- 🔒 FlashList for anything that scrolls and can grow. Never `ScrollView` + `.map()` for unbounded data. Never a list inside `Screen preset="scroll"`.
- Rows: `memo`, a stable `onPress(id)` from the screen (no per-row closures), fixed-size images, no `useEffect`, no layout state on scroll.
- `keyExtractor` returns a stable id; heterogeneous rows set `getItemType`.
- `onEndReached` guarded by `hasNextPage && !isFetchingNextPage`.
- Format dates and numbers once per item (in `select`), not on every render.
- Every new list or heavy screen gets a Reassure `*.perf-test.tsx` (copy `FeedScreen.perf-test.tsx`).

## 4. Images and animation

- 🔒 `<Image>` from `@/ui`. Request the size you render (thumbnails in lists), always set explicit dimensions, `priority="high"` only above the fold.
- Reanimated 4 for animation: animate `transform` and `opacity`, not `width`/`height`/`top`/`margin`.
- Never read `sharedValue.value` during render. Do work in worklets; cross back to JS only for the final result (`scheduleOnRN` from `react-native-worklets`).
- Gesture Handler 3 hook API (`usePanGesture`, …); keep gesture work in worklets.
- Respect Reduce Motion (`useReducedMotion`) for large movement.

## 5. Navigation and startup

- native-stack only; don't swap in the JS stack for a custom transition.
- Defer heavy work until the transition ends (`transitionEnd` listener) or `requestIdleCallback`. `InteractionManager` is removed in RN 0.87.
- Pause expensive work on unfocused screens (`useIsFocused`, TanStack `subscribed`).
- **Module scope stays side-effect free** — no network, storage reads or heavy work at import (inline requires depend on it).
- `bootstrap()` stays synchronous and minimal; anything not needed for the first frame runs after first render.
- `React.lazy` for rarely used heavy screens.

## 6. Network and memory

- Use the default `staleTime`; prefetch on intent rather than eagerly; paginate with cursors; request only needed fields.
- Persist only opted-in queries (whole-cache persistence costs JS-thread `JSON.stringify`).
- Every subscription and timer is cleaned up; no big arrays in Zustand.
- Few shadows/elevations in lists; no `adjustsFontSizeToFit` in rows.

## 7. Measuring

- Judge performance in a **release** build (`npm run android:staging` / `npm run ios:staging`), never a debug build.
- Render regressions: Reassure (`npm run test:perf`, runs in CI on PRs).
- Jank: React Native DevTools → Performance and Profiler; Android "Profile HWUI rendering".
- Never claim "faster" or "smooth" without a before/after measurement. If you couldn't measure, say so.

## 8. Never

- `ScrollView` + `.map()` over server data; nested virtualised lists.
- Full-size images in rows; images without dimensions.
- Animating layout properties; reading shared values in render.
- New work in `bootstrap()` or at module scope.
- Turning on Reanimated static feature flags or `maxPages` "for performance" without a profile.

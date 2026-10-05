# Coding rules

Full standards: `docs/CODING_STANDARDS.md`. 🔒 = enforced by lint, TypeScript or tests — don't argue with it, don't disable it.

## 1. TypeScript

- 🔒 Strict mode, `noUncheckedIndexedAccess`: handle `undefined` from indexing and lookups.
- 🔒 No `any` → `unknown` + narrowing, or a zod schema. No non-null `!`. No `enum` → `as const` object + union.
- 🔒 `import type` for type-only imports. Exhaustive `switch` on unions with `assertNever` (`@/shared/utils`) in `default`.
- API types come from zod: `type Order = z.infer<typeof OrderSchema>` — never a hand-written twin.
- `interface` for extendable object shapes, `type` for unions and compositions. Types live next to their owner.

## 2. Naming and files

| Thing               | Convention                                                                            | Example                            |
| ------------------- | ------------------------------------------------------------------------------------- | ---------------------------------- |
| Folders             | kebab-case                                                                            | `features/order-history/`          |
| Components, screens | PascalCase file = component; screens end `Screen`                                     | `OrderRow.tsx`, `OrdersScreen.tsx` |
| Hooks               | `useX.ts`, one concern each                                                           | `useOrders.ts`                     |
| Other modules       | camelCase                                                                             | `ordersApi.ts`, `ordersKeys.ts`    |
| Tests               | colocated `X.test.ts(x)`, perf `X.perf-test.tsx`                                      | `OrdersScreen.test.tsx`            |
| Constants / maps    | `UPPER_SNAKE` primitives, PascalCase maps                                             | `MAX_ITEMS`, `StorageKeys`         |
| Booleans            | `is/has/should/can`                                                                   | `isOnline`, `hasNextPage`          |
| Handlers            | props `onX`; inside, `handleX` or a verb                                              | `onPress`, `openItem`              |
| `testID`            | kebab-case `<feature>-<element>`; screens `<name>-screen`; rows `<feature>-item-<id>` | `sign-in-submit`, `feed-item-42`   |

🔒 Named exports only. Barrels (`index.ts`) only at module boundaries — never inside a feature.

## 3. Components and screens

- Function components only (class only for error boundaries).
- **Screens are thin:** compose a data hook + components. No `http` calls, business rules or magic numbers in screens.
- 🔒 Use `@/ui` primitives: `Text`, `Button`, `TextField`, `Screen`, `Image`, `ListRow`, `StateView`, `Chip`/`ChipRow`, `Badge`, `Section`, `Skeleton` — and `Pressable` from React Native. Lint names the replacement when you reach for a raw one.
- Export the props interface with the component: `export interface ButtonProps`.
- `memo` list rows and anything rendered per item. Elsewhere the React Compiler memoises — don't add `useMemo`/`useCallback` without a measured reason (exception: stable callbacks passed to memo'd rows).
- Every async surface renders **loading, empty, error, offline**: `Skeleton`/`LoadingState`, `EmptyState`, `ErrorState`, the offline banner. Show cached data instead of an error when there is some.
- `Screen preset="scroll"` never wraps a FlashList; list screens with an input use `preset="fixed"` + `avoidKeyboard`.

## 4. Hooks and effects

- `useEffect` only to sync with an external system (subscriptions, native APIs). Not for fetching (TanStack Query), not for derived state (compute during render), not to react to props.
- 🔒 `react-hooks` rules incl. React Compiler rules (purity, refs, no setState in render/effect bodies).
- Every subscription returns and calls its cleanup.
- Hooks return objects when they return more than two values.

## 5. Styling and theme

- `const useStyles = makeStyles(theme => ({ … }))` at the bottom of the file; `const styles = useStyles()` in the component.
- No hard-coded colours, font sizes or spacing → `theme.colors.*`, `theme.typography.*` / `<Text variant>`, `spacing.*`, `radius.*`.
- Add a colour role to `themes.ts` only if it's generic (`surfaceSunken`), never screen-specific (`ordersHeaderBlue`). Every role needs light and dark values.
- No inline style objects for static styles; inline only for truly dynamic values.
- 🔒 `useWindowDimensions()` — never `Dimensions.get`. Prefer flex layouts over computed sizes.
- Safe areas via `<Screen>` or `useSafeAreaInsets()`; never hard-code status-bar or notch heights.

## 6. Internationalisation and RTL

- 🔒 Every user-facing string through `t('feature.key')` (typed keys; a typo is a compile error). Exceptions: brand names, API-provided values.
- 🔒 Add the key to **every** locale file in the same change (`npm run i18n:check`).
- Plurals with `_one`/`_other` (+ language-specific forms such as Arabic's); interpolate values — never concatenate translated fragments.
- Validation messages are i18n keys (`z.email('validation.email')`), translated where shown.
- `@/ui` components receive translated strings (`StateView` is the exception — it maps errors).
- Logical layout only: `marginStart/End`, `paddingStart/End`, `start/end`, `<Text align="start">`. Never `marginLeft/Right` or `textAlign: 'left'` for direction-dependent layout.
- Language changes go through `changeLanguage` from `@/core/i18n` (it handles the RTL restart). Never call `I18nManager` directly.
- Icons that imply direction (back, forward, chevrons) must mirror in RTL.

## 7. Accessibility and testability

- Every interactive element: `accessibilityRole`, an `accessibilityLabel` when there's no visible text, touch target ≥ `MIN_TOUCH_TARGET` (48dp; use `hitSlop` for small visuals).
- Decorative images: `accessibilityLabel={null}`.
- `testID` on every screen root and every element a test or Maestro flow touches (naming in §2). Derive list `testID`s from stable ids, never the index.
- Every gesture (swipe, long-press) has a tap-based alternative.
- Respect Reduce Motion for large movement (`AI/rules/performance.md` §4).

## 8. Platform-specific code

- One implementation by default; `Platform.select` for small differences.
- `X.ios.ts` / `X.android.ts` only when whole implementations differ — identical exports and types.

## 9. Comments and hygiene

- Comments explain **why** (a constraint, a platform bug, a trade-off), never what the code says.
- No commented-out code, no leftover debug logging, no `TODO` without an owner or ticket.
- 🔒 `logger.debug/info/warn/error` from `@/core/logger` — `console.*` is a lint error.

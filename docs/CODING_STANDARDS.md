# Coding Standards

Rules marked **🔒** are enforced by tooling (ESLint, TypeScript, Prettier, tests, hooks). The rest are enforced in review. When a rule and a real need conflict, change the rule in a PR — don't silently disable it.

---

## 1. Architecture rules 🔒

| Rule                                                                             | Enforcement                               |
| -------------------------------------------------------------------------------- | ----------------------------------------- |
| Layers import downward only: `shared ← core ← ui ← features ← app`               | `boundaries/dependencies`                 |
| Features never import other features                                             | `boundaries/dependencies`                 |
| Outside a feature, import only its `index.ts` (or `mocks.ts` from dev bootstrap) | `boundaries/dependencies`                 |
| Vendor SDKs only inside their owning core module                                 | `no-restricted-imports` (`VENDOR_OWNERS`) |
| No import cycles                                                                 | `import-x/no-cycle`                       |
| Every file in `src/` belongs to a known layer (no new top-level folders)         | `boundaries/no-unknown-files`             |
| No `../../` relative imports — use `@/…`                                         | `no-restricted-imports`                   |

Need something from another feature? Move the shared part down (`core/`, `ui/`, `shared/`) or compose both features in `app/`.

## 2. TypeScript 🔒

- `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noUnusedLocals/Parameters`, `noFallthroughCasesInSwitch`.
- **No `any`** (`@typescript-eslint/no-explicit-any`). Use `unknown` + narrowing or a zod schema. If an `any` is truly unavoidable (third-party typing gap), add a one-line `eslint-disable-next-line` with the reason.
- **No non-null assertions** (`!`). Handle the `undefined` case.
- **No enums** — use `as const` objects + union types (`no-restricted-syntax`).
- `import type` for type-only imports (`consistent-type-imports`).
- Exhaustive `switch` on unions (`switch-exhaustiveness-check`); use `assertNever` for the default branch.
- Types live next to the code that owns them. API types are **inferred from zod schemas** (`z.infer`) — never hand-written in parallel.
- Prefer `interface` for object shapes that may be extended; `type` for unions and compositions.

## 3. Naming & files

| Thing                | Convention                                                     | Example                                     |
| -------------------- | -------------------------------------------------------------- | ------------------------------------------- |
| Directories          | kebab-case                                                     | `feature-flags/`, `features/order-history/` |
| Components & screens | PascalCase file = component name                               | `FeedItemRow.tsx`, `SignInScreen.tsx`       |
| Screens              | suffix `Screen`                                                | `SettingsScreen`                            |
| Hooks                | `useX.ts`                                                      | `useFeed.ts`                                |
| Other modules        | camelCase                                                      | `httpClient.ts`, `feedKeys.ts`              |
| Tests                | colocated `X.test.ts(x)`; perf `X.perf-test.tsx`               | `httpClient.test.ts`                        |
| Constants            | `UPPER_SNAKE_CASE` for primitives, PascalCase objects for maps | `MAX_RETRIES`, `StorageKeys`                |
| Booleans             | `is/has/should/can` prefix                                     | `isOnline`, `hasNextPage`                   |
| Event handlers       | `onX` props, `handleX` / verb functions inside                 | `onPress`, `openItem`                       |
| Query-key factories  | `<feature>Keys`                                                | `feedKeys.detail(id)`                       |
| API modules          | `<feature>Api` object of functions                             | `feedApi.getPage()`                         |

- **Named exports only** 🔒 (`import-x/no-default-export`; config files excepted). They rename safely and grep well.
- Barrel `index.ts` files exist at **module boundaries only** (each `core/*`, `ui`, each feature). Don't add barrels inside a feature.

## 4. Components

- Function components only (class components only for error boundaries).
- **Screens are thin:** they compose hooks (data) and components (presentation). No fetch calls, no business rules, no style constants beyond layout.
- Props interfaces are exported when the component is exported: `export interface ButtonProps`.
- Use `memo` for list rows and components rendered inside lists. Elsewhere, the React Compiler memoises automatically — don't scatter `useMemo/useCallback` without a measured reason; _do_ keep callbacks passed to memoised list rows stable.
- Styles via `makeStyles(theme => …)` at the bottom of the file. **No inline style objects** for static styles; inline only for truly dynamic values.
- 🔒 Use design-system primitives — `Text`, `Button`, `TextField`, `Screen`, `Image`, `Pressable` — not `react-native` `Text`, `TextInput`, `Image`, `Touchable*`, `SafeAreaView`, `KeyboardAvoidingView`, `FlatList` (lint names the replacement).
- **No hard-coded colours, font sizes or spacing.** Use `theme.colors.*`, `theme.typography.*`, `theme.spacing.*`. Semantic colour roles only; add a role to `themes.ts` only if it is generic ("surfaceSunken"), never screen-specific ("bookingCardShadow").
- **Logical layout:** `marginStart/End`, `paddingStart/End`, `start/end`, `<Text align="start">`. Never `marginLeft/Right` for direction-dependent spacing.
- Every interactive element: `accessibilityRole`, a label if there's no visible text, ≥48dp touch target (`MIN_TOUCH_TARGET`), `testID` on anything an E2E flow touches.
- Every async surface handles **loading, empty, error, offline** (`Skeleton` or `LoadingState`, `EmptyState`, `ErrorState`, offline pill).
- Horizontal chip/filter rows use `ChipRow`: a bare horizontal `ScrollView` defaults to `flexGrow: 1` and stretches in a flex column (only visible on a device).

## 5. Hooks

- Prefix `use`; one concern per hook; return objects (not tuples) when returning more than two values.
- Feature data hooks wrap TanStack Query and own their query keys, `select`, `placeholderData` and `meta`.
- `useEffect` is for synchronising with external systems — not for deriving state, not for reacting to prop changes you could compute during render, and not for data fetching (use TanStack Query).
- 🔒 `react-hooks/*` rules (incl. React Compiler rules: purity, refs, set-state-in-render/effect, immutability) must pass.

## 6. Data & API

- One endpoint = one function in `features/<x>/api/<x>Api.ts`, calling `http` with a **zod `schema`** and passing through `signal`.
- Query keys come only from the feature's key factory.
- Mutations: `onSuccess` → invalidate/update cache through the key factory; never auto-retry.
- Persist a query (`meta: { persist: true }`) only if it is non-sensitive **and** improves offline/instant-start UX. Bump `CACHE_SCHEMA_VERSION` when a persisted shape changes.
- Map DTO → domain shape at the API boundary (zod `.transform`) when the backend shape is awkward; components never see raw DTO quirks.

## 7. State

| Use                                      | When                                                        |
| ---------------------------------------- | ----------------------------------------------------------- |
| TanStack Query                           | Anything that lives on a server                             |
| Zustand store (`create`, selectors only) | Small, truly global client state shared across features     |
| `useState`/`useReducer`                  | Everything local                                            |
| MMKV via `appStorage`/`userStorage`      | Persisted preferences (through `StorageKeys`)               |
| Zustand + `validatedPersistOptions`      | Persisted client data; user data resets in `onSessionEnded` |

- Select the smallest slice: `useStore(s => s.status)`, never `useStore()` or `useStore(s => s)`.
- 🔒 Storage keys only from `StorageKeys` / `SecureKeys` (no string literals at call sites).

## 8. Errors & async 🔒

- Throw/propagate `AppError` (via `toAppError`) — never strings, never `{ success: false }` return values.
- No floating promises (`@typescript-eslint/no-floating-promises`): `await`, return, or explicitly `void` fire-and-forget calls.
- Async handlers in JSX are fine (`checksVoidReturn.attributes: false`), but they must handle their own errors (TanStack mutations do).
- Show users `t(errorMessageKey(error))`, not `error.message`.
- `catch` blocks either handle, convert to `AppError`, or rethrow — never swallow silently without a comment explaining why.

## 9. Logging & privacy 🔒

- `logger.*` only — `console.*` is a lint error.
- Never log tokens, passwords, OTPs, full request bodies of auth calls, or personal data. Redaction is a safety net, not a licence.
- Analytics events and properties must be declared in `AnalyticsEvents`; no PII in properties.
- Monitoring user = opaque id only.

## 10. Internationalisation 🔒

- Every user-facing string goes through `t()` with a typed key. No literal UI strings (exception: brand names, values from the API).
- Add keys to **every** locale in the same PR (`npm run i18n:check`, pre-commit + CI).
- Use plurals (`_one/_other`, plus language-specific forms) instead of string concatenation; interpolate values, never concatenate translated fragments.
- UI components receive already-translated strings (except `StateView`, which maps errors).

## 11. Platform-specific code

- Prefer one implementation. Use `Platform.select` for small differences; `File.ios.ts` / `File.android.ts` only when whole implementations differ, with identical exports and types.
- Native code changes (Podfile, Gradle, AppDelegate/SceneDelegate, manifests) need a note in the PR describing how they were tested on each platform.

## 12. Testing

- **Pure logic** → unit tests (no rendering). **Screens/components** → RNTL with `renderWithProviders`, querying by role/text/testID the way a user would; `userEvent` over `fireEvent`.
- Mock at **module boundaries** (`jest.mock('../api/feedApi')`), not `fetch`, unless you are testing the HTTP client itself. An unmocked request fails the test and names the URL.
- In RNTL 14 `fireEvent` is async: `await` it. Prefer `userEvent` for interactions.
- Every bug fix ships with a test that fails without it.
- Lists or render-heavy screens get a Reassure `*.perf-test.tsx`.
- Critical user journeys get a Maestro flow keyed on `testID`.

## 13. Formatting, commits & reviews 🔒

- Prettier decides formatting. Import order is enforced (`react`/`react-native` → packages → `@/…` → relative).
- Conventional Commits (`feat(feed): add pull-to-refresh`), scope = feature or core module, kebab-case.
- Small PRs; the PR template checklist (both platforms, light/dark, RTL, locales, states, no PII) must be ticked honestly.
- Comments explain **why**, not what. Delete commented-out code. No TODO without an owner/ticket.

## 14. Dependencies

- Before adding a package: can `core/` or `shared/` do it in < ~100 lines? Is it New-Architecture compatible? Maintained in the last 6 months? Who else uses it?
- Add a row to [DEPENDENCIES.md](./DEPENDENCIES.md) in the same PR. Native modules pinned exactly.
- If the package needs an install script, approve it explicitly (`npm install-scripts approve <pkg>`) — review what the script does first.

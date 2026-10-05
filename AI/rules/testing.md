# Testing and quality rules

Testing decisions: `docs/DECISIONS.md` §14. Reference tests: `src/features/feed/screens/FeedScreen.test.tsx`, `src/core/api/httpClient.test.ts`.

## 1. What each change needs

| Change                                | Test                                                                              |
| ------------------------------------- | --------------------------------------------------------------------------------- |
| Pure function, schema transform, util | Unit test (no rendering), every branch and edge case                              |
| Core module (`core/*`)                | Unit tests incl. failure paths (network, timeout, invalid data, concurrent calls) |
| Feature hook                          | Through the screen test, or a hook test when logic is non-trivial                 |
| Screen                                | RNTL test: renders data, empty, error (+ retry), and the main interaction         |
| UI component                          | RNTL test for behaviour (press, disabled, accessibility), not for styles          |
| List or render-heavy screen           | Also a Reassure `*.perf-test.tsx`                                                 |
| New route or deep link                | `linking.test.ts` covers it (add the path to its cases)                           |
| Critical user journey                 | Maestro flow in `.maestro/flows/` keyed on `testID`                               |
| Bug fix                               | A test that fails without the fix — written first                                 |

## 2. Tools and harness

- **Jest 29** (`@react-native/jest-preset`) + **RNTL 14** + **Reassure** + **Maestro**. Native modules are mocked once in `jest.setup.ts` — add new native mocks there, preferring the library's official mock.
- Render screens with `await renderWithProviders(<X />)` from `@test/render` (real QueryClient with no retries, safe area, Gesture Handler root). It's async — always `await` it.
- Query the way a user would: `getByRole`, `getByText`, `getByLabelText`, then `getByTestId`. Use `findBy*` for async content.
- Interactions: `const user = userEvent.setup(); await user.press(…)`. In RNTL 14, `fireEvent` is async too — `await` it if you use it.
- Matchers: `toBeOnTheScreen()`, `toBeDisabled()`, `toHaveTextContent()` (built into RNTL 14).

## 3. Mocking

- Mock at **module boundaries**: `jest.mock('../api/ordersApi', …)` and `jest.mocked(ordersApi.list)`. Don't mock `fetch` unless you're testing the HTTP client (then pass `fetchImpl` to `createHttpClient`).
- An unmocked request fails the test immediately and names the URL (`jest.setup.ts`). Fix the mock — never loosen the guard.
- Mock navigation with `jest.mock('@react-navigation/native', …)` overriding `useNavigation` (see `FeedScreen.test.tsx`).
- Build test data with small factories (`const item = (id: number): Item => ({ … })`), typed by the real schema type.
- Reset mocks in `beforeEach`; no shared mutable state between tests.

## 4. Writing good tests

- One behaviour per test, named as behaviour: `it('shows a translated error with retry when nothing is cached')`.
- Assert what the user sees or what the code returns — not internal calls, unless the call _is_ the behaviour (navigated to X, tracked event Y).
- Deterministic: no real timers, network, randomness or clock. Use `jest.useFakeTimers()` and fixed dates.
- Test the unhappy paths: errors from each `AppError` kind that matters, empty data, cancellation, double submit.

## 5. Coverage and gates

- `jest.config.js` thresholds are a **ratchet**: raise them when coverage grows, never lower them to pass.
- CI runs typecheck, lint, format, i18n parity, tests with coverage, `npm audit`, Reassure, and both platform builds. Locally, `npm run validate` covers the first five.
- Git hooks (lefthook): lint + format + i18n on commit, typecheck on push, commitlint on the message. Never bypass with `--no-verify`.

## 6. Testability rules for UI code

- `testID` on every screen root and every element a test or flow touches (naming: `AI/rules/coding.md` §2). Derive list `testID`s from stable ids.
- Loading, empty, error and offline states render distinct, queryable elements (`loading-state`, `empty-state`, `error-state`, `offline-banner`).
- Interactive elements have an accessibility role and label — this is how tests and screen readers find them.
- Toasts and errors stay visible long enough to assert; never fake loading with a bare `setTimeout`.
- Mock data in dev (`mocks.ts`) is deterministic, so Maestro flows are stable.

## 7. Forbidden

- Deleting, skipping (`.skip`, `xit`), or weakening a failing test to go green.
- Tests that assert nothing, or only that something rendered without checking content.
- Snapshot tests as the main check of behaviour.
- Lowering coverage thresholds, or adding files to coverage exclusions to hide untested code.
- Reporting "tests pass" without having run them in this session.

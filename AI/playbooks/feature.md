# Playbook — new feature, screen or endpoint

**Load with this:** `AI/rules/architecture.md`, `AI/rules/data-layer.md`, `AI/rules/coding.md`; add `performance.md` for lists or animation, `security.md` for auth, permissions or personal data. Human recipe: `docs/COOKBOOK.md` → "Add a feature". Reference: `src/features/feed/`.

## 1. Analyse

- Read `AI/project/brief.md` for the business rules the feature must respect.
- Get the **API contract** (endpoints, request/response shapes, error codes) from `AI/project/context.md` or the user. No contract → ask; don't invent fields.
- Search for what exists: a similar feature, UI components, hooks, utils, translation keys.
- Decide the scope: new feature folder, or a screen/endpoint in an existing feature?

## 2. Plan (Medium or Large — wait for approval)

Use the plan template in `AI/core/workflow.md` §3. It must name:

- Route name, deep-link path, and which navigator group (signed-in or signed-out).
- Endpoints and zod schemas; query keys; which queries persist (default: none).
- States: loading, empty, error, offline — and what each shows.
- New translation keys; analytics events; feature flag (if it ships dark).
- Tests: screen test cases, perf test (lists), Maestro flow (critical journeys).

## 3. Implement — in this order

| #   | Step                | File(s)                                                                                         |
| --- | ------------------- | ----------------------------------------------------------------------------------------------- |
| 1   | Schemas + endpoints | `features/<f>/api/<f>Api.ts` — zod schema, inferred types, `http` with `schema` + `signal`      |
| 2   | Query keys          | `features/<f>/api/<f>Keys.ts`                                                                   |
| 3   | Hooks               | `features/<f>/hooks/use<X>.ts` — queries own keys/select/meta; mutations invalidate via keys    |
| 4   | Components          | `features/<f>/components/` — `memo` list rows with stable `onPress(id)`                         |
| 5   | Screen              | `features/<f>/screens/<X>Screen.tsx` — hook + components + state views; root `testID`           |
| 6   | Strings             | every file in `src/core/i18n/locales/`                                                          |
| 7   | Public API          | `features/<f>/index.ts` — export screens only                                                   |
| 8   | Route               | `src/app/navigation/RootNavigator.tsx` — screen, options title via `i18n.t`, explicit `linking` |
| 9   | Dev mock (optional) | `features/<f>/mocks.ts` + register in `src/app/bootstrap/mocks.ts` — matches the real contract  |
| 10  | Tests               | screen test with `renderWithProviders` + mocked `<f>Api`; perf test for lists; linking case     |

Rules while implementing:

- Screens stay thin; no `http` in components; no cross-feature imports (compose in `app/`).
- Use `@/ui` components; add a variant to an existing component before creating a new one.
- Persist nothing sensitive; user data that survives restarts uses `validatedPersistOptions` + `onSessionEnded`.

## 4. Test

`npm run validate`, then run the flow on iOS and Android with the mock API (`npm run ios:dev`, `npm run android:dev`): happy path, empty, error (Dev Menu → `Network: toggle 30% failures`), offline (`Network: toggle offline`), slow (`Network: cycle latency`), dark mode, Arabic/RTL. For a list, `npm run test:perf`.

## 5. Close

- `AI/checklists/done.md`.
- Add the feature to `AI/project/context.md` → Features; update `status.md`.
- A new decision (library, pattern) → `docs/DECISIONS.md`.

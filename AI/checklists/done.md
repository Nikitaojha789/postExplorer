# Checklist — definition of done

Walk this before saying "done" or opening a PR. It extends `.github/pull_request_template.md`.

## Scope

- [ ] Every changed line traces to the task; no drive-by edits, renames or reformatting
- [ ] No working code deleted without approval; only my own orphans (unused imports, keys, files) removed
- [ ] One concern (feature, fix or refactor) in this change

## Verified — with real output in the report

- [ ] `npm run validate` passes (typecheck, lint, format, i18n parity, tests)
- [ ] Coverage thresholds hold (`npm run test:coverage`); none lowered
- [ ] Platform checks for the change type (`AI/core/workflow.md` §5) run — or listed as "not verified" with the reason

## Architecture and code

- [ ] Code in the right layer and folder; no cross-feature imports; no new top-level folders
- [ ] Existing infrastructure reused (`http`, storage, logger, `AppError`, `@/ui`); nothing parallel added
- [ ] No `any`, `!`, enums, `eslint-disable`, `@ts-expect-error`, `console.*`, commented-out code or untracked `TODO`

## Behaviour and UI

- [ ] Loading, empty, error and offline states handled
- [ ] Every user-facing string translated in **all** locales; RTL-safe layout (logical props)
- [ ] Light and dark mode correct (theme roles, no hard-coded colours)
- [ ] Accessibility roles/labels, touch targets ≥48dp, `testID`s on screens and tested elements

## Data and security

- [ ] Every endpoint has a zod schema and threads `signal`; keys from the factory
- [ ] No secrets, tokens or PII in code, logs, analytics, navigation params, persisted data
- [ ] Persisted shapes versioned (`CACHE_SCHEMA_VERSION` / store `version` + `migrate`); user data reset on sign-out
- [ ] Dev-only code under `__DEV__` with lazy `require`, absent from the release bundle

## Tests

- [ ] New behaviour tested; bug fix has a test that fails without it
- [ ] List/heavy screen has a Reassure test; new route has a linking case; critical journey has a Maestro flow
- [ ] No test skipped, deleted or weakened

## Memory and docs

- [ ] `AI/project/status.md` updated (done, resume point, session log)
- [ ] `AI/project/context.md` updated if features, contracts or environments changed
- [ ] `docs/` and the matching `AI/rules/` line updated if a convention changed; `docs/DECISIONS.md` for new decisions; `docs/DEPENDENCIES.md` for packages

# Playbook — start a project from Baseline, or adopt `AI/` in one

Two cases. Both begin read-only: **no application code changes until the user approves the plan.**

## A. New project created from Baseline

1. **Confirm the starting point.** `npm install`, `npm run validate` — record the result in `status.md` as the baseline.
2. **Fill `AI/project/` with the user** (ask; don't invent business facts — mark unknowns `DECISION NEEDED`):
   - `brief.md` — product, users, core business rules, terminology.
   - `context.md` — backend contract (base URLs, auth flow, error envelope, pagination), environments, integrations, planned features, do-not-touch.
   - `status.md` — phase, first tasks.
3. **Plan the project-shell changes** and get approval (each is a separate, small change):
   - Rename app / bundle ids / schemes (`docs/COOKBOOK.md` → "Rename the app").
   - Brand tokens and colours (`src/ui/theme/tokens.ts`, `themes.ts`), splash (`react-native-bootsplash` generator).
   - `.env.*` URLs; `USE_MOCK_API` stays `true` until the backend is ready.
   - Backend error envelope → `parseErrorBody`; refresh contract → `core/auth/session.ts` (hard stops: plan them).
   - Languages: keep, add, or disable switching (`LANGUAGE_SWITCHING_ENABLED`).
   - Reference features (`feed`, `settings`, `auth`): adapt, or delete with their routes, locale keys, mocks and Maestro flows.
4. **Build features** with `AI/playbooks/feature.md`, one at a time.

## B. Existing project that started from Baseline

1. **Discover (read-only).**
   - `npm run validate` and note failures.
   - Compare against Baseline: versions in `package.json`, `eslint.config.mjs` changes (disabled rules, removed boundaries), new top-level folders, new libraries, removed tests, lowered coverage thresholds.
   - List features (`src/features/*`), routes, storage keys, env vars, integrations.
2. **Seed `AI/project/`** from what you found; confirm business facts with the user.
3. **Gap register** (still read-only) — write it into `status.md`:

   | #   | Issue | Location | Rule broken | Severity | Fix effort |
   | --- | ----- | -------- | ----------- | -------- | ---------- |

   Severity: CRITICAL (secrets, tokens in plain storage, PII in logs, auth bypass) · HIGH (architecture violations, untested critical paths, banned libraries) · MEDIUM · LOW. Committed secrets → flag for rotation + history purge.

4. **Present the register and a remediation order; stop for approval.** Order: safety-net tests → CRITICAL security → architecture/tooling regressions → the rest, one concern per change.
5. **Remediate incrementally** with `bug-fix.md` / `refactor.md`, updating the register as items close.

## Never during setup

- "Clean up" the whole repo in one pass.
- Delete working code because it doesn't match Baseline — legacy isn't dead; plan its replacement.
- Change native config, dependencies or auth without the hard-stop approval.

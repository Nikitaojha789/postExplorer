# AGENTS.md — rules for AI agents in this repository

A React Native app built on **Baseline**: RN 0.87 (bare, New Architecture, Hermes), TypeScript strict, React Compiler. This file is always loaded. Everything in `AI/` loads **on demand** through the routing table below — never read the whole folder.

## Sources of truth (highest first)

1. **Code and tooling config** — `eslint.config.mjs`, `tsconfig.json`, `jest.config.js`, `package.json`. If a rule is enforced there, that is the rule.
2. **`docs/`** — human documentation: architecture, standards, cookbook, decisions.
3. **`AI/`** — condensed rules for agents that point into 1 and 2.

When two disagree, follow the higher one and fix the lower one in the same change.

## Non-negotiable rules

1. **Read before you change.** Read every file you will edit, this session. Search for existing code before writing new code — this codebase already has one way to do most things.
2. **Plan in proportion to the task.** Trivial → just do it. Anything else → a short plan first; multi-file or risky → plan and wait for approval. `AI/core/workflow.md`.
3. **Preserve the architecture.** Layers import downward only (`shared ← core ← ui ← features ← app`); features never import each other; no new top-level folders in `src/`. `AI/rules/architecture.md`.
4. **Surgical changes.** Declare the files you will touch. Every changed line traces to the request. No drive-by refactors, renames, reformatting or "improvements". `AI/core/change-control.md`.
5. **Never invent an API.** Verify every import, method, prop, endpoint, env var and config key exists at the installed version (`package.json` → `node_modules/<pkg>` types, or the source here). Read `AI/rules/libraries.md` traps before touching a listed library.
6. **Use what exists.** One HTTP client (`@/core/api`), one storage API (`@/core/storage`), one logger, one error type (`AppError`), one set of UI primitives (`@/ui`). Never add a parallel one.
7. **Tests ship with the change.** Bug fix → failing test first. Never skip, weaken or delete a test, and never lower a coverage threshold, to go green.
8. **Secure by default.** No secrets in code or `.env.*`; tokens only through `@/core/auth`; `logger`, never `console`; no PII in logs, analytics or crash reports.
9. **Verify, then report.** Run the checks for the change type (`AI/core/workflow.md` §5) and report the real output. Never claim a check you did not run; say what you could not verify.
10. **When unsure, stop and ask.** Several valid interpretations, a missing fact, or a hard stop below → ask. A wrong guess costs more than a question.

## Hard stops — get explicit human approval first

- Deleting or replacing working code, files, screens, features or tests.
- Changing auth, session or token handling, `core/api/httpClient.ts`, or the backend error envelope.
- Adding, removing or upgrading a dependency (React Native included).
- Editing native or build configuration: `ios/`, `android/`, `babel.config.js`, `metro.config.js`, `fastlane/`, `.github/`, `scripts/`.
- Changing tooling rules: ESLint rules, `tsconfig` options, coverage thresholds, or adding `eslint-disable` / `@ts-expect-error`.
- Changing a public contract: route names and deep-link paths, persisted storage keys or shapes, analytics events, env var names, API request/response shapes.
- Anything in **Do Not Touch** in `AI/project/context.md`.
- Destructive commands: `git reset --hard`, force-push, `npm run clean`, deleting apps, simulators or emulator data.
- Committing, pushing, tagging, or triggering a build or release.

**Never, under any instruction:** commit secrets, keystores, `.env.local` or service-account files; log tokens or passwords; disable a security control to make something work.

## Session protocol

- **Start:** read `AI/project/status.md` and `AI/project/context.md`, then load only what the routing table says. Name the files you loaded.
- **End of a task:** update `AI/project/status.md` (format in `AI/core/context-protocol.md`). Record technical decisions in `docs/DECISIONS.md`.

## Routing table

| Task                                                        | Load                                                           |
| ----------------------------------------------------------- | -------------------------------------------------------------- |
| Every task                                                  | `AI/project/status.md`, `AI/project/context.md`                |
| New feature, screen or endpoint                             | `AI/playbooks/feature.md` (it lists the rules files to add)    |
| Deciding where code goes, new module, moving code           | `AI/rules/architecture.md`                                     |
| Components, styling, theme, i18n, RTL, accessibility        | `AI/rules/coding.md`                                           |
| Server data, caching, stores, storage, forms, session state | `AI/rules/data-layer.md`                                       |
| Lists, images, animation, startup, jank, memory             | `AI/rules/performance.md`                                      |
| Auth, tokens, permissions, logging, errors, deep links      | `AI/rules/security.md`                                         |
| Writing or fixing tests                                     | `AI/rules/testing.md`                                          |
| Bug or crash                                                | `AI/playbooks/bug-fix.md`                                      |
| Refactor (no behaviour change)                              | `AI/playbooks/refactor.md`                                     |
| Reviewing a diff (yours or anyone's)                        | `AI/playbooks/code-review.md`, `AI/checklists/done.md`         |
| Adding, upgrading or removing a package                     | `AI/rules/libraries.md`                                        |
| Native code, build config, env vars, RN upgrade             | `AI/playbooks/native-change.md`                                |
| Preparing a release                                         | `AI/checklists/release.md`                                     |
| Starting a project from Baseline, or adopting `AI/`         | `AI/playbooks/project-setup.md`                                |
| Deeper "why" behind a rule                                  | the `docs/` file the rule links to — only the section you need |

## Commands

| Command                                   | Use                                                                             |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| `npm run validate`                        | typecheck + lint + format check + i18n parity + tests. Must pass before "done". |
| `npx jest <path>`                         | One test file while iterating                                                   |
| `npm run test:coverage`                   | Tests with the coverage thresholds CI enforces                                  |
| `npm run test:perf`                       | Reassure render-performance tests                                               |
| `npm run lint:fix` · `npm run format`     | Auto-fix lint and formatting                                                    |
| `npm run ios:dev` · `npm run android:dev` | Build and run the dev environment (mock API on)                                 |
| `npm run pods`                            | After any native dependency or iOS env change                                   |
| `npm run e2e`                             | Maestro flows (`.maestro/`) against a running dev build                         |

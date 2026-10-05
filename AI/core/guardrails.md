# Guardrails — how to behave

These prevent the expensive AI failures: almost-correct code, invented APIs, sprawling diffs, lost context, and code a human can't follow. They favour caution over speed; for trivial tasks, use judgement.

## 1. Think before coding

- State your assumptions. If a request has more than one reasonable reading, list them and ask — don't pick silently.
- If a simpler approach exists, say so. Push back when the request fights the architecture, and explain with a file path.
- Name what you don't know. "I couldn't find where X is set" beats a confident guess.

## 2. Simplicity first

- Minimum code that solves the asked problem. No speculative props, options, abstractions, hooks or "future-proofing".
- No new layer (service, repository, manager, context, HOC) when a function or hook does the job — `docs/ARCHITECTURE.md` §6 explains why there are none.
- No error handling for impossible states; handle the real ones (`AI/rules/security.md` §Errors).
- If it's 200 lines and could be 50, rewrite it before showing it.

## 3. Read, don't recall

- Read a file this session before editing it. After context compaction, re-read it — a summary is not source code.
- Search before you write: `grep -rn` for an existing hook, component, util or key that already does it. Reuse beats re-implementation.
- Never describe or summarise code you haven't opened.

## 4. Never invent an API

If you haven't verified it, it doesn't exist.

| Before using…                     | Verify in                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------- |
| A library method, prop or hook    | Version in `package.json`, then `node_modules/<pkg>` type definitions           |
| An in-house function or component | Its definition in `src/` — quote the path in your plan                          |
| An env var                        | `EnvSchema` in `src/core/config/env.ts`                                         |
| A storage key, event, flag, route | `core/storage/keys.ts`, `core/analytics`, `core/feature-flags`, `RootNavigator` |
| A backend endpoint or field       | The API contract in `AI/project/context.md`, or ask                             |
| A translation key                 | `src/core/i18n/locales/en.json`                                                 |

Read `AI/rules/libraries.md` traps before touching a listed library. Mark anything you couldn't verify **UNVERIFIED** in your plan and resolve it before coding.

## 5. Hard parts get extra rigour

AI is weakest at business logic, concurrency, money, dates and edge cases. For those:

- Write the algorithm as numbered plain-language steps first.
- List the edge cases: empty, null, zero, negative, duplicate, very long, offline, slow network, request cancelled, app backgrounded, permission denied, RTL, timezone and DST, rounding.
- Encode the edge cases as tests before the logic.
- Money: integer minor units (cents), never floating-point arithmetic. Dates: `Intl` and ISO strings; never parse locale-formatted strings.
- Concurrency: name the race (double tap, two refreshes, stale response after unmount) and show how the code prevents it.

## 6. Honesty

- Report what you ran and what it printed. "Lint passes" means you ran lint and saw it pass.
- Say what you could not verify — "not tested on Android", "no device available" — instead of implying it.
- If you broke something, say so first, then fix it.
- If you notice an unrelated problem, mention it; don't fix it unasked (`AI/core/change-control.md` §4).

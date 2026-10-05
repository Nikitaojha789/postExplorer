# Workflow — analyse → plan → implement → test → review → close

Every task goes through the same six steps. Size decides how much each step costs, not whether it happens.

## 1. The loop

| Step          | Do                                                                                                                                                                             | Output                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- |
| **Analyse**   | Read `status.md`, `context.md`, and every file in the path of the change. Find the existing pattern (the `feed` feature is the reference). Find the tests that cover the area. | What exists, what's missing |
| **Plan**      | Size the task (§2). Write the plan (§3) at that depth. Ask questions. Wait for approval if required.                                                                           | Approved plan               |
| **Implement** | Small increments in the declared files only. Match surrounding style. Run the fast check (`npx jest <file>`, `npm run typecheck`) after each increment.                        | Working code + tests        |
| **Test**      | Run the verification for the change type (§5). Fix failures at their cause.                                                                                                    | Real command output         |
| **Review**    | Re-read your whole diff as a reviewer with `AI/playbooks/code-review.md`. Walk `AI/checklists/done.md`.                                                                        | Clean diff                  |
| **Close**     | Report (§6). Update `AI/project/status.md`, and `context.md` / `docs/` if structure or contracts changed.                                                                      | Report + updated memory     |

## 2. Sizing

| Size        | Examples                                                                          | Plan                                        | Approval before coding    |
| ----------- | --------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------- |
| **Trivial** | Copy change, typo, one-line fix covered by a test                                 | One sentence                                | No                        |
| **Small**   | One component or hook, one file plus its test                                     | Files + approach + verification (3–5 lines) | No — state it, then do it |
| **Medium**  | A screen, an endpoint with hook and screen, a new UI component, 3+ files          | Full plan (§3)                              | **Yes**                   |
| **Large**   | A new feature, cross-cutting change, anything touching a hard stop in `AGENTS.md` | Full plan + risks + increments + rollback   | **Yes**, per increment    |

Unsure between two sizes → take the larger. A task that grows mid-flight (new files, new dependency, hard stop) → stop, re-plan, ask.

## 3. Plan template

```
Goal: <one sentence: what the user can do after this change>
Current → target: <what exists now → what will exist>
Files: NEW <path> · MODIFY <path> · DELETE <path> (needs approval)
Reuse: <existing hooks/components/utils this builds on, with paths>
Contracts touched: <routes, storage keys, events, env vars, API shapes — or "none">
Tests: <which existing tests protect it; which new tests prove it>
Verification: <commands from §5 + platforms to check>
Questions: BLOCKING / IMPORTANT / NICE-TO-HAVE — each with the default you'll assume
Assumptions: ASSUMPTION [HIGH|MEDIUM|LOW] <…>
Unverified: UNVERIFIED <API or fact still to confirm> (must be empty before coding)
```

## 4. Implementation discipline

- Edit only declared files. Need another? Say so, add it to the plan, continue only if it's within the approved scope.
- One concern per change. Never mix a refactor, a bug fix and a feature.
- Write the test with the code, not after the "real" work. For bugs and tricky logic, write it first.
- Prefer adding to the existing pattern over inventing a new one; copy the shape of `src/features/feed/`.
- Keep the app runnable after every increment. Don't leave the tree broken between steps.
- Log surprises (a bug you found, a missing contract, a wrong doc) in your report and `status.md` — don't silently work around them.

## 5. Verification by change type

Always: **`npm run validate`** must pass. Then add what the change needs:

| Change                                    | Also run / check                                                                                                                                           |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pure logic, hooks, API layer              | Unit tests cover new branches; `npm run test:coverage` thresholds hold                                                                                     |
| Screen or UI component                    | Run it on **iOS and Android** (`npm run ios:dev`, `npm run android:dev`); light and dark; Arabic/RTL if layout changed; loading/empty/error/offline states |
| List, animation, heavy screen             | Reassure test (`npm run test:perf`); scroll check on Android; release build if jank is the question (`AI/rules/performance.md` §7)                         |
| Navigation or deep link                   | `src/app/navigation/linking.test.ts` passes; open the link on a simulator (`xcrun simctl openurl booted "<scheme>://<path>"`)                              |
| Auth, session, network handling           | Dev Menu → `Network:` / `Auth:` entries (offline, latency, failures, token expiry) on a simulator                                                          |
| Dev-only code (`__DEV__`)                 | Release bundle doesn't contain it (`AI/rules/security.md` §8)                                                                                              |
| Native, build config, dependency, env var | `AI/playbooks/native-change.md` §4                                                                                                                         |

If you can't run a check (no simulator, no device), say so in the report. Don't substitute a weaker check silently.

## 6. Report format

```
Done: <what changed, 1–3 lines>
Files: <list>
Verified: <command> → <result>   (paste the summary lines, e.g. "Tests: 74 passed")
Not verified: <what and why>
Follow-ups: <anything noticed but out of scope>
```

## 7. Status markers

`MUST` / `SHOULD` / `COULD` priority · `BLOCKED` · `ASSUMPTION [HIGH|MEDIUM|LOW]` · `UNVERIFIED` · `RISK` · `DECISION NEEDED` · `TECH-DEBT` · change types `NEW` / `MODIFY` / `DELETE` / `MOVE` / `PRESERVE`.

# Playbook — code review

Use for any diff: a human's, another agent's, or your own before saying "done". Review the **diff** against the rules; don't redesign the feature.

**Load with this:** `AI/checklists/done.md`, and for each area the diff touches, the matching `AI/rules/` file.

## Order of review

1. **Scope.** Every changed line traces to the task. Flag unrelated edits, reformatting, renames, deleted code nobody asked to delete, and suspicious file counts.
2. **Hallucinations.** Every import, method, prop, hook, env var, storage key, translation key and endpoint exists at the installed version. AI diffs fail here more than anywhere — check `AI/rules/libraries.md` §4.
3. **Architecture.** Right layer and folder; no cross-feature imports; no parallel infrastructure (second HTTP client, storage wrapper, logger, error type); extension points used (`AI/rules/architecture.md` §4).
4. **Correctness.** Business rules from `AI/project/brief.md`; edge cases (empty, null, long text, offline, cancelled, double tap, RTL); async races and unmount; error paths produce `AppError` and translated messages.
5. **Data layer.** Schema on every endpoint, `signal` threaded, keys from the factory, mutations invalidate correctly, no server data in Zustand, persisted shapes versioned.
6. **Security.** No secrets, tokens or PII in code, logs, analytics, navigation params or persisted queries; sensitive screens stay in the signed-in group; dev-only code stripped.
7. **Performance.** FlashList for growing data, memo'd rows with stable callbacks, sized images, no work at module scope or in `bootstrap()`, animations on transform/opacity.
8. **UI quality.** `@/ui` primitives, theme tokens, logical (RTL-safe) layout, all strings translated in every locale, loading/empty/error/offline states, accessibility roles/labels, `testID`s.
9. **Tests.** New behaviour tested; bug fix has a regression test; assertions are meaningful; nothing skipped or weakened; thresholds untouched.
10. **Contracts and docs.** Public contract changes approved and migrated; `context.md`, `status.md`, `docs/` updated where affected.

## Output

| #   | File:line | Severity | Issue | Suggested fix |
| --- | --------- | -------- | ----- | ------------- |

Severity: **BLOCKER** (correctness, security, data loss, broken contract) · **MAJOR** (fix before merge) · **MINOR** (follow-up is fine) · **NIT** (style; never blocks).

End with a verdict — `APPROVE`, `APPROVE with MINORs`, or `REQUEST CHANGES` — and the top 1–3 items. If you ran something to verify a finding, say what and show the output.

## Receiving review (agent as author)

Verify each finding before acting — reviewers can be wrong. Push back with evidence (file path, lint rule, doc section) when a suggestion conflicts with the rules. Don't agree performatively.

# Playbook — refactor (behaviour stays identical)

Behaviour preservation is the whole contract. A refactor that changes what users see, what the app sends or stores, or a public contract (`AI/core/change-control.md` §6) is not a refactor — plan it as a feature or fix.

**Load with this:** `AI/core/change-control.md`, `AI/rules/architecture.md`.

## Procedure

1. **Justify it.** Refactor only when asked, or when the approved task can't be done cleanly without it (state why in the plan). "Cleaner" alone is not a reason.
2. **Safety net.** Find the tests covering the code. Missing coverage on behaviour you'll touch → write characterisation tests first.
3. **Green baseline.** `npm run validate` must pass before you start. Never refactor on a red baseline.
4. **Blast radius by search.** List every import, call site, mock, test and string reference (`grep -rn`). Write the list into `status.md` for anything over ~5 files.
5. **Declare** what changes and what stays identical (props, return shapes, routes, storage keys, events, rendered output).
6. **Small steps.** One move/rename/extract at a time; validate after each. Prefer add-new → switch callers → delete-old over big-bang rewrites.
7. **Verify equivalence.** Full suite green with assertions **unchanged** (only imports/paths may change in tests); `npm run test:perf` shows no regression for touched screens; run the affected flow on a simulator.
8. **Close.** Update `status.md`; update `context.md` / `docs/` if module boundaries moved.

## Rules

- Never mix a refactor with a feature or bug fix — separate changes.
- Bugs found mid-refactor → log them, finish (or abort) the refactor, fix them separately.
- No API "modernisation" of working code (switching patterns or libraries) without approval.
- If a test's assertion must change, behaviour changed — stop and re-plan.

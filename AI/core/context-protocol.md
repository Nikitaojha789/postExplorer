# Context protocol — token budget and memory across sessions

Two failures to prevent: forgetting decisions between sessions, and wasting context by reading everything.

## Loading budget

- **Always:** `AGENTS.md`.
- **Every session:** `AI/project/status.md` and `AI/project/context.md`; `AI/project/brief.md` only when the task involves business behaviour.
- **Per task:** the 1–4 files the routing table names. Read a `docs/` file only for the section a rule links to.
- **Never:** load `AI/` recursively, read all of `docs/`, or open large files whole when a search finds the lines you need.

## Session start

1. Read `status.md`: what's in progress, the exact resume point, blockers.
2. Read `context.md`: features, backend contract, environments, do-not-touch.
3. Route the task; say which files you loaded so the human can spot missing context.

## Task end (and session end)

Update `AI/project/status.md`:

- **In Progress** → the exact resume point ("OrdersScreen renders; cancel mutation test failing on 409 case; next: map 409 in ordersApi").
- **Done** → one line per finished item with date; prune old ones (git remembers).
- **Session Log** → 3–5 lines: what changed, decisions, the one thing a fresh session must know. Keep the last 5 entries.
- Keep the file under ~150 lines.

Also update, when affected:

| Changed                                    | Update                                      |
| ------------------------------------------ | ------------------------------------------- |
| Feature added, removed or renamed          | `AI/project/context.md` → Features          |
| Backend contract learned or changed        | `AI/project/context.md` → Backend           |
| Technical decision made (library, pattern) | `docs/DECISIONS.md` (new section)           |
| Architecture or convention changed         | `docs/` file + matching rule in `AI/rules/` |
| Domain term introduced                     | `AI/project/brief.md` → Terminology         |

## Long tasks (multi-file refactors, renames, migrations)

1. Before starting, find every affected file **by search** and write the list as a checklist in `status.md`.
2. Work in batches; tick items and run checks after each batch.
3. If the session ends or context compacts, the next session resumes from the checklist, not from memory.

## Output economy

- Show diffs or the changed lines, not whole files.
- Reference rules instead of restating them ("per `data-layer.md` §3").
- Plans in tables and bullets; no filler sections for small tasks.

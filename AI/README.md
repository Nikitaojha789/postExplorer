# AI/ — governance for AI-assisted development

Rules and procedures that let AI agents work in a Baseline-derived React Native app without breaking its architecture, performance or security. Written for agents; this page is for humans.

It is the React Native–specific edition of the team's Master Governance Folder: same model (always-loaded contract, on-demand rules, living project memory), but every rule is tied to this codebase — real module names, real lint rules, real commands — and backend-only material (databases, migrations, server deploys) is left out.

## How it works

Agents never read the whole folder. Three layers keep context small:

| Layer        | Files                                                | Loaded        |
| ------------ | ---------------------------------------------------- | ------------- |
| 1 · Contract | `AGENTS.md` (repo root; `CLAUDE.md` imports it)      | Always        |
| 2 · Memory   | `AI/project/status.md`, `AI/project/context.md`      | Every session |
| 3 · Task     | 1–4 files picked by the routing table in `AGENTS.md` | Per task      |

`AI/` does not repeat `docs/`. It states each rule in one line and links to `docs/` for the reasoning. Tooling (ESLint, TypeScript, Jest) outranks both: a rule the linter enforces is never argued about in prose.

## Folder map

```
AGENTS.md                 always-loaded contract: rules, hard stops, routing table, commands
CLAUDE.md                 Claude Code entry point (imports AGENTS.md)
AI/
├── README.md             this page
├── core/                 how an agent works — any task
│   ├── guardrails.md       behaviour: think first, simplicity, no invented APIs, honesty
│   ├── workflow.md         analyse → plan → implement → test → review; sizing; verification
│   ├── change-control.md   creating, modifying, deleting and moving code; public contracts
│   └── context-protocol.md token budget, session start/end, status format
├── rules/                what correct code looks like here
│   ├── architecture.md     layers, where code goes, extension points
│   ├── coding.md           TypeScript, naming, components, styling, i18n/RTL, a11y
│   ├── data-layer.md       HTTP, zod, TanStack Query, Zustand, storage, session, forms
│   ├── performance.md      threads, rendering, lists, images, animation, startup
│   ├── security.md         secrets, tokens, logging, errors, deep links, permissions
│   ├── testing.md          what to test, harness, RNTL/Reassure/Maestro, testability
│   └── libraries.md        dependency policy + installed versions + hallucination traps
├── playbooks/            step-by-step procedures
│   ├── feature.md  bug-fix.md  refactor.md  code-review.md
│   ├── native-change.md    ios/, android/, env vars, build config, RN upgrades
│   └── project-setup.md    new project from Baseline, or adopting AI/ into one
├── checklists/
│   ├── before-coding.md  done.md  release.md
└── project/              the ONLY per-project files — keep them current
    ├── brief.md            product, users, business rules, terminology
    ├── context.md          features, backend contract, environments, do-not-touch
    └── status.md           read first, updated last, every session
```

## Using it in a new project

1. Create the project from Baseline (`docs/QUICK_GUIDE.md` §2). `AGENTS.md`, `CLAUDE.md` and `AI/` come with it.
2. Ask your agent: _"Set up the project using AI/playbooks/project-setup.md"_. It fills `AI/project/` with you and changes no app code until you approve.
3. From then on, agents read `status.md` at the start of a session and update it at the end.

**Other tools.** Tools that read `AGENTS.md` at the repo root need nothing more (for example Codex and GitHub Copilot's coding agent). Claude Code reads `CLAUDE.md`. For any other tool, add one project rule that says: _"Before any task, read AGENTS.md at the repo root and follow it."_ Check your tool's docs for where project rules live.

## Maintenance

- **Agent made a mistake that could repeat?** Add one line to the trap list in `AI/rules/libraries.md` (library misuse) or the "Never" list of the relevant rules file. This is the highest-value edit in the folder.
- **Changed a rule in `docs/` or the lint config?** Update the matching one-liner in `AI/rules/` in the same PR.
- **Upgraded a dependency?** Update its row in `AI/rules/libraries.md` and re-check its traps.
- Keep `AI/project/status.md` under ~150 lines. Git keeps the history.
- Only `AI/project/` changes per project. Improvements to everything else should go back to Baseline so every project gets them.

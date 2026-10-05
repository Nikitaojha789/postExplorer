# Checklist — before editing any file

## Context

- [ ] `AI/project/status.md` and `context.md` read; routing files loaded and named
- [ ] Every file I'll edit read in this session; the existing pattern found (`src/features/feed/` for features)
- [ ] Library traps in `AI/rules/libraries.md` §4 read for each library I'll touch

## Plan

- [ ] Task sized (`AI/core/workflow.md` §2); plan written at that depth; **approved** if Medium/Large
- [ ] Ambiguities asked; remaining ones marked `ASSUMPTION [confidence]`
- [ ] Success criteria are checkable ("screen test X passes; flow works on both platforms")

## Change radius

- [ ] Files to create/modify/delete declared
- [ ] Zero `UNVERIFIED` items: every API, prop, key, env var and endpoint confirmed to exist
- [ ] No hard stop (`AGENTS.md`) without approval; nothing in **Do Not Touch**
- [ ] Public contracts touched (routes, storage keys, events, env names, API shapes) listed — or "none"

## Safety

- [ ] Tests that protect this area identified; new tests planned (bug → failing test first)
- [ ] Auth, tokens, permissions, personal data → `AI/rules/security.md` loaded
- [ ] Lists, animation, startup → `AI/rules/performance.md` loaded
- [ ] Complex logic → steps and edge cases written before code

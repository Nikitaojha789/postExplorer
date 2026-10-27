# Status — Baseline

<!-- FIRST file every session reads, LAST file every session updates. Under ~150 lines:
     prune Done (git remembers), keep the last 5 session-log entries. Format: AI/core/context-protocol.md -->

**Phase:** Active — Posts Explorer feature complete · **Health:** green · **Last updated:** 2026-10-27

## In progress (exact resume point)

- none

## Next up

1. Optional physical device testing and profiling

## Blockers / DECISION NEEDED

- none

## Known issues / TECH-DEBT

- Not yet run: iOS release archive with signing, Maestro flows in CI, profiling on a physical low-end Android device (`docs/ARCHITECTURE.md` §6).

## Multi-step checklist (in-flight refactors/migrations)

- none

## Done (recent)

- 2026-10-27 Bottom tabs configured in RootNavigator with Posts and Settings tabs; Logout flow and test suite added.
- 2026-10-27 Auth flow integrated with RootNavigator, demo sign-in accepting any email and password "password", and persistent hint text.
- 2026-10-18 Production Posts Explorer app implemented with FlashList, TanStack Query, error/retry states, pull-to-refresh, deep linking, and unit test suite
- 2026-10-05 `AI/` governance folder, `AGENTS.md`, `CLAUDE.md` added
- 2026-10-02 Hardening from product stress-test findings (`docs/BOILERPLATE_FINDINGS.md`)

## Session log (last 5)

### 2026-10-27 — Settings tab & Logout integration

- Added: `MainTabs` (`createBottomTabNavigator`) in `RootNavigator.tsx` with `PostList` and `Settings` tabs.
- Configured: Tab bar labels, testIDs (`tab-posts`, `tab-settings`), localized titles and icons.
- Tested: `SettingsScreen.test.tsx` verifying theme selections and logout button ending the session; all 22 test suites (88 tests) passing; `npm run validate` passing.

### 2026-10-27 — Auth flow integration & login demo credentials

- Fixed: 404 ("couldn't find what you were looking for") on login caused by missing `/auth/sign-in` endpoint on JSONPlaceholder.
- Changed: `authApi.ts` supports demo authentication accepting any valid email and password `"password"`.
- UI: `SignInScreen.tsx` displays hint text below the submit button: `"Login with any email and password is \"password\""`.
- Tested: 21 test suites, 84 tests passing; full `npm run validate` passing.

- Changed: created `src/features/posts` with `postsApi.ts`, `postsKeys.ts`, `usePosts.ts`, `PostCard.tsx`, `PostListScreen.tsx`, `PostDetailScreen.tsx`, `mocks.ts`, `index.ts`.
- Configured: `RootNavigator.tsx` with `PostList` and `PostDetail`, `en.json` and `ar.json` with localized keys, `.env.*` pointed to JSONPlaceholder.
- Tested: 20 test suites, 80 tests passing; full `npm run validate` passing.

### 2026-10-05 — AI governance

- Changed: added `AGENTS.md`, `CLAUDE.md`, `AI/` (core, rules, playbooks, checklists, project).
- Decisions: `AI/` condenses and links to `docs/`; tooling config outranks both.
- A fresh session must know: `npm run validate` is the minimum gate; hard stops are listed in `AGENTS.md`.

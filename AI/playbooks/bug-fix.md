# Playbook — bug fix

**Rule zero: never fix what you can't reproduce or explain.** The usual AI failure is a plausible guess applied to a symptom. This loop forbids guessing.

**Load with this:** `AI/rules/testing.md`, plus the rules file for the area (`data-layer`, `security`, `performance`…) and its traps in `AI/rules/libraries.md`.

## 1. Reproduce

- Pin down: exact steps, platform (iOS/Android, version), build type (debug/release), environment, signed-in state, network state, language/direction, expected vs actual.
- Encode it as a **failing test** whenever the code can be tested. That test defines "fixed" and stays forever.
- Can't reproduce → collect evidence (logs, Sentry event, device, data), don't move to fixes.

**React Native–specific ways to reproduce:**

| Symptom shape                               | Try                                                                                           |
| ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Only in release / TestFlight / Play         | `npm run android:staging` / `npm run ios:staging` — bundling and Babel issues only show there |
| Only on one platform                        | Platform files (`*.ios.ts`), `Platform.select`, native config, library platform bugs          |
| Network: offline, slow, flaky, token expiry | Dev Menu → `Network:` and `Auth:` entries (`src/app/bootstrap/devMenu.ts`)                    |
| Only after restart                          | Persisted state: MMKV stores, persisted queries, `CACHE_SCHEMA_VERSION`, store `version`      |
| Only in Arabic                              | RTL: physical `left/right` styles, `textAlign`, non-mirrored icons                            |
| Deep link opens the wrong screen or nothing | `linking.test.ts`; missing explicit `linking` path; signed-out gating                         |
| Stale data after sign-out / user switch     | A store not reset via `onSessionEnded`; query keys missing the user scope                     |
| Jank, blank list cells                      | Measure in release first (`AI/rules/performance.md` §7)                                       |

## 2. Gather evidence — read, don't recall

- Read the whole code path this session, end to end. Quote the error and stack trace exactly.
- `git log -p -- <files>` on the involved files: new code is the usual suspect.
- Check the library traps (`AI/rules/libraries.md` §4) — wrong-version API use is a frequent cause.
- Debug tools: React Native DevTools (`j` in Metro): console, breakpoints, network, React profiler.

## 3. One root-cause hypothesis

State one hypothesis, its evidence, and confidence `[HIGH|MEDIUM|LOW]`. It must explain **every** symptom. Separate cause from trigger ("the request fails" is a symptom; "the refresh races the retry" is a cause). Prove it cheaply (a log, a narrower test) before fixing.

## 4. Fix minimally, at the root

- Smallest change that makes the failing test pass. No refactoring in a bug fix.
- No symptom masking: no catch-and-ignore, no `?? fallback` hiding a value that shouldn't be missing, no `setTimeout`/retry to dodge a race, no `eslint-disable`.
- If the real fix is large or touches a hard stop, say so and propose it as a planned change; a stopgap must be marked `TECH-DEBT`.

## 5. Verify

- The reproduction test passes; `npm run validate` passes.
- Re-run the original scenario on the affected platform(s) — the test alone isn't enough when the bug was platform- or device-specific.

## 6. Record

- `status.md`: what broke, the root cause in one line, where it was fixed.
- A trap others could hit → one line in `AI/rules/libraries.md` §4 or the relevant rules file.

## Circuit breakers

- **Two failed attempts → stop.** Back to step 2; list what you know vs what you believe.
- **The fix keeps spreading across files →** wrong root cause or a design problem. Stop and re-plan with the user.
- **Can't explain why it works →** not fixed.
- **Touches auth, session, payments or persisted data →** high risk: full-flow tests, both platforms, human review.

# Checklist — release

Process: `docs/ENVIRONMENTS_AND_RELEASES.md` §3–7. Agents prepare and verify; **a human triggers the release workflow** (hard stop).

## Readiness

- [ ] `main` is green in CI (Quality, Performance, Android, iOS)
- [ ] Version bumped in `package.json` in a merged PR (patch = fixes, minor = features, major = breaking for users); build number comes from CI
- [ ] `status.md` has no open `BLOCKED` / `DECISION NEEDED` items for this release
- [ ] Changes since the last release reviewed for migrations: persisted shapes (`CACHE_SCHEMA_VERSION`, store `version`), storage/secure keys, deep-link paths, analytics events

## Verified on release builds

- [ ] Staging release build on **iOS and Android**: sign-in, core journeys, deep link, sign-out, session restore after restart
- [ ] Maestro flows pass against the build (`npm run e2e`)
- [ ] Upgrade path: install the previous store version, sign in, upgrade to this build — still signed in, data intact
- [ ] Offline and slow network behave (cached data visible, offline banner, no sign-out on flaky refresh)
- [ ] Dark mode and RTL spot-checked; text not truncated in the longest language
- [ ] Performance: Flashlight run on a low-end Android device compared with the previous release (`docs/PERFORMANCE.md` §11)

## Production configuration

- [ ] `.env.production` points to production URLs; `USE_MOCK_API` is irrelevant in release but not `true` by mistake
- [ ] Release bundle free of dev code (mocks, Dev Menu tools, test hooks)
- [ ] Sentry DSN set; source maps and dSYMs upload (`SENTRY_AUTH_TOKEN` in the GitHub Environment)
- [ ] Release signing via CI secrets; nothing signed with the debug key
- [ ] Store requirements met (`docs/ENVIRONMENTS_AND_RELEASES.md` §7): target SDK, privacy manifest, Data safety / privacy labels match what the app collects
- [ ] New permissions have clear usage strings; account deletion offered if sign-up exists

## After release

- [ ] Crash-free rate and new issues watched in Sentry for the first 24–48 hours
- [ ] Rollout staged where the store allows (Play staged rollout, App Store phased release); halt criteria agreed
- [ ] `status.md` updated with the release entry

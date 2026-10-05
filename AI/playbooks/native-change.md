# Playbook — native code, build config, env vars, upgrades

Every change here is a **hard stop**: propose the plan, wait for approval. Mistakes here often pass `npm run validate` and only fail on a device, in a release build, or in CI. Human reference: `docs/ENVIRONMENTS_AND_RELEASES.md`.

## 1. What counts as native or build config

`ios/` (Podfile, `AppDelegate`, `SceneDelegate`, `Info.plist`, entitlements, xcconfigs, schemes), `android/` (Gradle files, `AndroidManifest.xml`, `MainActivity`/`MainApplication`, ProGuard/R8 rules), `babel.config.js`, `metro.config.js`, `app.json`, `.env.*`, `scripts/`, `fastlane/`, `.github/workflows/`, `package.json` scripts and dependencies.

## 2. Ground rules

- Prefer a JS solution or an existing library config option over editing native code.
- Never edit generated files: `ios/Config/Generated/*`, `ios/Pods/`, build outputs.
- iOS deep links and window setup live in `SceneDelegate` (UIScene lifecycle, required with the iOS 27 SDK) — not in `AppDelegate`.
- `#if DEBUG` is false in the custom Xcode configurations unless `DEBUG` is defined for them — check before relying on it.
- Keep all four environments (`dev`/`qa`/`staging`/`prod`) working; a change to one flavor or scheme usually needs the others.
- Release signing stays enforced in CI (`REQUIRE_RELEASE_SIGNING`); never commit signing material.
- Babel plugin order: React Compiler first, `react-native-worklets/plugin` last.

## 3. Common changes

**Add an env var**

1. Add it to all four `.env.*` files (public values only — `AI/rules/security.md` §1).
2. Add it to `EnvSchema` in `src/core/config/env.ts`.
3. Add it to `test/mocks/react-native-config.ts`.
4. Needed by native iOS code? Add it to `NATIVE_KEYS` in `scripts/ios-env.mjs` (no `//` in values — xcconfig treats it as a comment), then `npm run pods`.
5. CI or release needs it? Add it to the GitHub Environment and the workflow.

**Add a permission**

1. iOS: the `NS…UsageDescription` string in `Info.plist` (user-facing — explain why). If `react-native-permissions` needs it, enable the permission in the Podfile setup it documents, then `npm run pods`.
2. Android: `<uses-permission>` in `AndroidManifest.xml`; nothing more than needed.
3. Request it just in time via `@/core/permissions` (`AI/rules/security.md` §7).

**Add a native dependency** — `AI/rules/libraries.md` §2.

**Change app name, bundle id or scheme** — `docs/COOKBOOK.md` → "Rename the app"; never after a store release.

**Upgrade React Native** — one minor at a time, with the Upgrade Helper diff, following `docs/ENVIRONMENTS_AND_RELEASES.md` §9. Re-check every native dependency's supported RN range first.

## 4. Verification (all required)

```bash
npm run validate
```

```bash
npm run pods
```

```bash
npm run ios:dev
```

```bash
npm run android:dev
```

Then a release-mode build of at least one platform, because bundling (Babel), R8 and config problems only show there:

```bash
npm run android:staging
```

Android CLI builds need `ANDROID_HOME` set (usually `$HOME/Library/Android/sdk` on macOS).

Also check what the change affects: deep links still open (`xcrun simctl openurl booted "<scheme>://<path>"`); the permission prompt shows the right text; the env value reaches JS (`env` in a dev build) and native (`Info.plist` / `BuildConfig`). Record which platforms and build types you actually ran in the report — CI covers only `devDebug` (Android) and `Debug-Dev` (iOS simulator).

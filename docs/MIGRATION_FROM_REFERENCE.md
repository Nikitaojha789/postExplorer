# Migration Notes — `reference_project/Sehanexis` → Baseline

The reference app (RN 0.85.3, React 19.2, ~24k lines in `src/`) was audited file by file. This document records what was **kept**, what was **replaced** and why, and a practical order for moving an existing app onto the baseline.

---

## 1. Audit summary

### Worth keeping (migrated, re-implemented, or kept as a pattern)

| Reference                                                                             | Why it's good                                            | Where it lives now                                                                                                                                                          |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Single-flight token refresh with a queue + "session expired" latch (`api/request.ts`) | Correct instinct: concurrent 401s must share one refresh | `core/api/httpClient.ts` (`refreshOnce`) — now typed, unit-tested with concurrent requests, and refresh distinguishes _rejected_ (sign out) from _transient_ (keep session) |
| DTO normalisation at the API boundary (`normalizeVerifyOtpResponse`)                  | Screens never see backend quirks                         | zod schemas with `.transform()` in each feature's `api/`                                                                                                                    |
| Standard request headers (`Accept-Language`, device type, app version)                | Useful for backend analytics/localisation                | `core/api/client.ts` `getDefaultHeaders` (version from the binary, not a hard-coded `'1.0.0'`)                                                                              |
| Design tokens + semantic theme roles + system/light/dark preference                   | Right layering                                           | `ui/theme/` — far fewer, generic roles; native `Appearance` override                                                                                                        |
| Themed `NavigationContainer` to avoid white flashes                                   | Real polish                                              | `ui/theme/navigationTheme.ts`                                                                                                                                               |
| `getChangedFields` / `hasNoChanges` (PATCH only edited fields)                        | Pure, reusable, saves bandwidth                          | `shared/utils/changedFields.ts` (+ tests, null-tolerant typing)                                                                                                             |
| `{ en, ar }` parity rule, `t()` everywhere, localised validation messages             | Correct i18n discipline                                  | Enforced by `scripts/check-i18n.mjs` (pre-commit + CI) and typed keys                                                                                                       |
| Per-domain hooks returning `{ data, loading, error, refresh }`                        | Good component API                                       | Same shape from TanStack Query hooks, without the hand-written cache                                                                                                        |
| react-hook-form + schema validation                                                   | Right tools                                              | RHF + zod 4                                                                                                                                                                 |
| `DEVELOPMENT_GUIDELINES.md` and PR checklist culture                                  | Rare and valuable                                        | Expanded into `docs/` + `.github/pull_request_template.md`; the important rules are now lint-enforced                                                                       |
| `getInitials` helper                                                                  | Small, reusable                                          | `shared/utils/string.ts` (null-safe, tested via usage)                                                                                                                      |

### Replaced (problems found)

| #   | Reference pattern                                                                                                      | Problem                                                                                                                | Replacement                                                                                          |
| --- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1   | Access + refresh tokens stored in **AsyncStorage**, and `console.log` of tokens in `AppConstant.setUserToken`          | Plain-text secrets on disk and in device logs (shipped in release builds)                                              | Refresh token in Keychain/Keystore, access token in memory only, redacting logger, `no-console` lint |
| 2   | `AppConstant` mutable static class as global token/user holder                                                         | Hidden global state, untestable, import cycles                                                                         | `core/auth` session store (no tokens) + `tokens` module                                              |
| 3   | Four copy-pasted request functions (`GetRequest`/`PostRequest`/`PatchRequest`/`DeleteRequest`)                         | Duplicated logic, inconsistent behaviour (`res.json()` vs text parsing), `any` everywhere                              | One `request()` with method helpers                                                                  |
| 4   | Network layer shows toasts and toggles a global spinner (`checkResponse`, `setLoading`)                                | Couples IO to UI; full-screen modal spinner blocks the whole app                                                       | Typed `AppError`; per-screen loading/error states; toast only from UI code                           |
| 5   | Errors returned as `null`/`{success:false}`; envelope checked as `status` in one place, `success` in another           | Callers lose error information; silent inconsistency                                                                   | Throw `AppError` with `kind/status/code/fieldErrors`                                                 |
| 6   | Server data cached in Redux with hand-written `loaded/loading/error` flags per slice                                   | No staleness, dedupe, cancellation, retry or pagination                                                                | TanStack Query                                                                                       |
| 7   | Legacy Redux (string action types, switch reducer, `Store.dispatch` imported everywhere, `default: return {...state}`) | Boilerplate, import cycles (`request.ts → store/action → store`), new state object on unknown actions                  | Zustand for the little remaining client state                                                        |
| 8   | Hard-coded API base URL with commented alternatives; `@env` types declared but unused                                  | No environments; wrong URL can ship                                                                                    | `.env.*` per flavor/scheme + zod-validated `env.ts`                                                  |
| 9   | Offline → whole navigator replaced by a "Network" screen                                                               | Every connectivity blip destroys navigation state                                                                      | Queries pause; non-blocking offline pill; cached data stays visible                                  |
| 10  | Lists rendered with `ScrollView` + `.map()` (Home, Explore, Records)                                                   | No virtualisation; memory and jank grow with data                                                                      | FlashList (FlatList is a lint error; ScrollView + `.map()` is caught in review)                      |
| 11  | JS stack navigator (`@react-navigation/stack`)                                                                         | Transitions on the JS thread                                                                                           | `native-stack`                                                                                       |
| 12  | Stale `RootStackParamList` (routes copied from another app), `useNavigation<any>`                                      | Navigation types lie                                                                                                   | Static API with inferred types                                                                       |
| 13  | JS-only RTL (`allowRTL(false)` + physical left/right swaps via `useRTL()` in every component)                          | Native headers, gestures, back buttons, third-party components don't mirror; every component must remember the helpers | Native RTL (`forceRTL` + one restart on direction change) + logical props                            |
| 14  | Theme interface with 115 mostly screen-specific colour roles (`eligibilityGridBg`, `bookingCardShadow`…)               | Theme becomes a dumping ground; dark mode coverage unknowable                                                          | ~22 generic semantic roles                                                                           |
| 15  | `Dimensions.get('screen')` at module load for `w()/h()`                                                                | Wrong on rotation, split-screen, foldables; `screen` includes system bars                                              | `useWindowDimensions` (lint bans `Dimensions.get`) + flex layouts                                    |
| 16  | God files: `icons.tsx` (2,409 lines), `appIcon.tsx` (1,677), screens of 600–886 lines                                  | Slow reviews, merge conflicts, poor tree-shaking                                                                       | Feature folders; icon sets split per feature when added                                              |
| 17  | `babel.config.js` contains a literal `...` inside `plugins`                                                            | Syntax error — config cannot have been loaded as written                                                               | Documented, ordered plugin list                                                                      |
| 18  | `TimeHelper` imports `moment`, which is not in `package.json`                                                          | Dead/broken code; moment is legacy and heavy                                                                           | `Intl.DateTimeFormat`; moment banned by lint                                                         |
| 19  | Mock data and `mockApi` imported by screens (shipped in release)                                                       | Bundle bloat, risk of mock data in production                                                                          | Dev-only mock server, stripped from release (verified)                                               |
| 20  | Unrelated leftovers (`appName = 'Radx'`, merchant keys, bank-name lists, solar-system routes)                          | Copy-paste drift between projects                                                                                      | Clean template; nothing app-specific outside features                                                |
| 21  | ProGuard off and release signed with the debug key                                                                     | Larger, unobfuscated APKs; unsignable for Play                                                                         | R8 + shrinking on; release signing via env/properties, enforced in CI                                |
| 22  | `useMemo` used to call `setState` (`AppSpinner`); snackbar via global mutable ref + un-cleared `setTimeout`            | React anti-patterns, leaks                                                                                             | Zustand toast queue with cleared timers, UI-thread animations                                        |
| 23  | Hard-coded English tab labels despite the "no literal strings" rule                                                    | Rules without enforcement erode                                                                                        | Typed `t()` keys + i18n parity check                                                                 |
| 24  | ESLint 8 legacy config, Prettier 2, no type-aware lint, no tests beyond the template                                   | Quality depends on discipline                                                                                          | ESLint 10 flat config with architecture rules, Prettier 3, Jest + RNTL + Reassure, lefthook, CI      |

---

## 2. Mapping table (old → new)

| Reference path                                      | Baseline equivalent                                                              |
| --------------------------------------------------- | -------------------------------------------------------------------------------- |
| `src/api/request.ts`, `api/baseUrl.ts`              | `src/core/api/httpClient.ts`, `client.ts`; base URL in `.env.*`                  |
| `src/api/api_method/<X>Api.ts`                      | `src/features/<x>/api/<x>Api.ts` (+ zod schemas, `<x>Keys.ts`)                   |
| `src/hooks/use<X>.ts`                               | `src/features/<x>/hooks/use<X>.ts` (TanStack Query)                              |
| `src/store/*`                                       | `src/core/auth/sessionStore.ts`; most slices disappear into TanStack Query       |
| `src/store/Asyncstorage.ts`                         | `src/core/storage` (`appStorage`, `userStorage`, `secureStorage`)                |
| `src/constant/app_constant.ts`                      | `core/auth/tokens.ts`, `core/config/buildInfo.ts`                                |
| `src/theme/tokens.ts`, `themeContext.tsx`           | `src/ui/theme/tokens.ts`, `themes.ts`, `useTheme.ts`, `themePreference.ts`       |
| `src/i18n/*`, `useRTL.ts`, `utils/rtl.ts`           | `src/core/i18n/*`; RTL helpers removed in favour of logical props                |
| `src/components/*` (generic)                        | `src/ui/components/*`                                                            |
| `src/components/<domain>/*` (family, registration…) | `src/features/<domain>/components/*`                                             |
| `src/screen/<area>/*`                               | `src/features/<area>/screens/*`                                                  |
| `src/route/*`                                       | `src/app/navigation/*`                                                           |
| `src/data/mock*.ts`, `mockApi.ts`                   | `src/features/<x>/mocks.ts` (dev-only)                                           |
| `src/helper/Helper.ts` (`log`, `showToast`)         | `core/logger`, `ui` `toast`                                                      |
| `src/helper/Validator.ts`, `validationSchema.ts`    | zod schemas next to their form/feature                                           |
| `src/helper/CallActivity.ts` (tel/mailto/WhatsApp)  | `shared/` or a `core/linking` helper using `Linking.openURL` with error handling |
| `src/components/WebViewScreen.tsx`                  | Feature screen + `react-native-webview` (add when needed)                        |
| `src/asset/icons/*`                                 | Split per feature; add `react-native-svg` with the icon set                      |

---

## 3. Recommended migration order

Migrate **vertically**, one feature at a time, keeping the app shippable at every step.

1. **Bootstrap the shell.** Copy the baseline; set app name/ids (COOKBOOK → rename), brand tokens (`tokens.ts`), `.env.*` URLs, splash logo (`npx react-native-bootsplash generate`).
2. **Auth first.** Port OTP send/verify/resend into `features/auth/api` with zod schemas (port `normalizeVerifyOtpResponse` as a schema `.transform`). Map the verify response to `startSession(tokens, user)`. Point `REFRESH_PATH` and `TokenPairSchema` at the real refresh contract (`{ RefreshToken }` request body → adapt in `session.ts`). Registration/onboarding steps become screens in the auth feature (or an `onboarding` feature) gated by an `if:` group on a `requiresProfileSetup` session field.
3. **Error envelope.** Adapt `parseErrorBody` once to the backend shape (`{ status, message, errors }`) — every feature benefits.
4. **One read-heavy feature** (e.g. Doctors/Explore): API + keys + `useDoctors` (infinite query) + FlashList screen. Validate the pattern with the team, then copy it.
5. **Mutations** (appointments, family members): `useMutation` + `invalidateQueries` replace the Redux `setFamilyMembers([...existing, created])` bookkeeping.
6. **Shared UI.** Promote reusable widgets (`AppButton`, `AppInput`, `OtpInput`, `RatingStars`…) into `ui/components` only when a second feature needs them; restyle with semantic roles.
7. **Translations.** Move `en.json` / `ar.json` keys feature by feature; `npm run i18n:check` keeps parity.
8. **RTL.** Delete `useRTL()` usages as screens move; replace `r.row` with plain `flexDirection: 'row'`, `r.ms(8)` with `marginStart: 8`, `r.textAlign` with `<Text align="start">`.
9. **Delete the old store** once no screen reads it.

### Behaviour changes to communicate

- Language switches between Arabic and English **restart the app once** (with a confirmation). This is what makes native components mirror correctly.
- Going offline no longer shows a blocking screen; cached data remains usable.
- Sessions survive app restarts via the Keychain; the access token is refreshed on first use.

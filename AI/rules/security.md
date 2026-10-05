# Security and error-handling rules

Controls and their reasons: `docs/ARCHITECTURE.md` §5.1–5.3 (OWASP MASVS-aligned). Anything here that you need to change is a hard stop.

## 1. Secrets and configuration

- `.env.*` files are **public**: every value ships inside the binary. Only API URLs, timeouts, schemes, DSNs and feature defaults go there.
- Secrets (write-capable API keys, signing material, service accounts) live on the backend or in CI secrets — never in the app, `.env.*`, source, tests or fixtures.
- Read config only through `env` from `@/core/config` (zod-validated; the app refuses to start when invalid). 🔒 Only `core/config` imports `react-native-config`.
- Never commit keystores (`*.jks`, `*.keystore`), `keystore.properties`, `.env.local`, `google-services.json`/`GoogleService-Info.plist` with real keys, or `.p8`/`.p12` files. Found one already committed → report it for **rotation and history purge**; deleting the file isn't enough.

## 2. Tokens and session

- Refresh token: Keychain/Keystore only (`secureStorage`, `THIS_DEVICE_ONLY`). Access token: memory only. Both handled inside `@/core/auth` — features never touch tokens.
- Nothing sensitive in MMKV, Zustand, the query cache, persisted queries, navigation params or deep links. MMKV is unencrypted.
- Sign-out goes through `endSession()`, which clears the query cache, user stores (`onSessionEnded`), user storage, monitoring/analytics identity and the Keychain item. Never sign out by clearing pieces yourself.
- A refresh that fails for a transient reason must **not** sign the user out (the refresh contract in `core/auth/session.ts`). Keep it that way.
- No hard-coded test credentials, OTPs or auth bypasses in app code paths. Test values belong in mocks and fixtures.

## 3. Logging, analytics and crash reports

- 🔒 `logger` only. Never log tokens, passwords, OTPs, full auth request/response bodies, card or ID numbers, or personal data. Redaction (`core/logger/redact.ts`) is a safety net, not permission.
- Analytics: only events declared in `AnalyticsEvents`; no PII in properties; ids must be opaque.
- Monitoring: `sendDefaultPii` stays `false`; identify users by opaque id only; scrub in `beforeSend`.

## 4. Errors

- **One error type.** Everything thrown is normalised with `toAppError()` into `AppError { kind, status?, code?, fieldErrors?, cause }`. Kinds: `offline` `timeout` `cancelled` `network` `unauthorized` `forbidden` `not_found` `conflict` `validation` `rate_limited` `server` `parse` `unknown`.
- Branch on `error.kind` — never on status codes or message strings in features.
- Throw or propagate `AppError` — never strings, never `{ success: false }` return values, never `null` to mean failure.
- **Users see** `t(errorMessageKey(error))` (or field errors on forms) — never `error.message` or raw server text.
- `catch` blocks must handle, convert (`toAppError`), or rethrow. An empty or log-only catch needs a comment explaining why it's safe.
- 🔒 No floating promises: `await`, return, or mark fire-and-forget with `void`.
- Query and mutation errors are reported centrally (`QueryCache`/`MutationCache` `onError`, only `isReportable`). Don't report the same error again in a screen.
- Render errors: the root `ErrorBoundary` catches crashes. Wrap risky widgets (third-party views, rich content) in a local `ErrorBoundary`.
- Screens show `ErrorState` only when there's no cached data; with cached data, show the data plus a toast or inline notice.
- Don't add retries, `try/catch` or `?? default` to hide a failure. Fix the cause or surface it.

## 5. Network

- HTTPS only. Cleartext is allowed only for debuggable Android variants (manifest placeholder) and ATS stays on for iOS — don't add exceptions.
- All requests go through `http` (auth header, timeout, refresh, error mapping, zod validation).
- Validate every response with a schema; treat backend data as untrusted input.
- URLs built from user input or deep links: encode path segments; never let input choose the host.
- Certificate pinning, root/jailbreak detection and screenshot blocking are opt-ins (`docs/DECISIONS.md` §12) — add only when the project's risk profile requires it.

## 6. Deep links and navigation

- Auth-gated screens are unreachable while signed out (`if:` groups) — never move a sensitive screen out of the signed-in group.
- Parse and validate every link param (`linking.parse`, then zod in the screen if it drives a request). Treat params as untrusted.
- Deep links never carry tokens, passwords or PII.

## 7. Permissions, WebViews and files

- Ask for permissions just in time with `ensurePermission` / `usePermission` (`@/core/permissions`), explain why first, and handle "blocked" with `openSettings`. Add the native usage strings (`Info.plist`, `AndroidManifest.xml`) — `AI/playbooks/native-change.md`.
- WebView (if added): load only allow-listed hosts, no `javascriptEnabled` for untrusted content, no `originWhitelist={['*']}`, never inject tokens.
- Uploads: check type and size before sending; never trust a client-side filename on the server side either.

## 8. Dev-only code

- Dev tools, mocks and test hooks run only under `__DEV__` and are required lazily inside the `if (__DEV__)` branch (`src/core/api/client.ts`, `src/app/bootstrap/bootstrap.ts` show the pattern). A top-level import would ship them to production.
- After adding dev-only code, verify it's absent from a release bundle:

```bash
npx react-native bundle --platform android --dev false --minify true --entry-file index.js --bundle-output /tmp/main.jsbundle && grep -c "<a string unique to your dev code>" /tmp/main.jsbundle
```

The count must be `0`.

## 9. AI traps seen in mobile code

- Storing tokens in AsyncStorage/MMKV "for now", or putting them in a Zustand store.
- Logging a request or response "to debug" and leaving it in.
- `console.log(error)` that prints auth headers.
- Showing `error.message` from the server to users.
- Adding a test OTP, default password or `if (__DEV__) skipAuth` path.
- Putting an API key in `.env.*` because "it's not committed" — it ships in the binary.
- A new screen added outside the signed-in group, reachable by deep link.
- Catch-and-ignore to make a flaky call "work".

# Project context — Baseline

<!-- Per-project technical map, loaded every session. Pre-filled for the Baseline template itself;
     replace with the real project's facts at kickoff (AI/playbooks/project-setup.md).
     Keep it a map (~100 lines): details belong in code, docs/ and brief.md. -->

## Stack

Baseline defaults — see `AI/rules/libraries.md` §3. Deviations from Baseline in this project:

- none

## Features

| Feature    | Screens (route → deep-link path)                | Endpoints                                  | Status                                  |
| ---------- | ----------------------------------------------- | ------------------------------------------ | --------------------------------------- |
| `posts`    | `PostList` → `''`, `PostDetail` → `posts/:id`   | `GET /posts`, `GET /posts/:id`             | Live — JSONPlaceholder                  |
| `auth`     | `SignIn` → `sign-in` (signed-out group)         | `POST /auth/sign-in`, `POST /auth/refresh` | Reference — adapt to the real auth flow |
| `feed`     | `Feed` (tab) → `feed`, `FeedItem` → `items/:id` | `GET /items`, `GET /items/:id`             | Reference — replace or delete           |
| `settings` | `Settings` (tab) → `settings`                   | —                                          | Reference — keep and extend             |

## Backend contract

- **Base URLs:** `API_URL` in `.env.{development,qa,staging,production}`. Dev uses the in-app mock API (`USE_MOCK_API=true`).
- **Auth:** bearer access token (memory) + refresh token (Keychain). Refresh: `POST /auth/refresh` (`REFRESH_PATH` in `core/auth/session.ts`) → `TokenPairSchema`.
- **Error envelope:** `{ message?, error?, code?, errors?: { field: string | string[] } }`, parsed once in `parseErrorBody` (`core/api/httpClient.ts`).
- **Pagination:** cursor-based (`nextCursor`) in the reference feed.
- **API docs / contract source:** <link to OpenAPI or backend repo — DECISION NEEDED>

## Environments

| Env         | `.env` file        | App id suffix | Deep-link scheme   | Backend           |
| ----------- | ------------------ | ------------- | ------------------ | ----------------- |
| development | `.env.development` | `.dev`        | `baseline-dev`     | mock API (in-app) |
| qa          | `.env.qa`          | `.qa`         | `baseline-qa`      | <url>             |
| staging     | `.env.staging`     | `.staging`    | `baseline-staging` | <url>             |
| production  | `.env.production`  | —             | `baseline`         | <url>             |

## Integrations

| Service | Purpose                 | Where                 | Status                        |
| ------- | ----------------------- | --------------------- | ----------------------------- |
| Sentry  | Crashes, performance    | `src/core/monitoring` | Off until `SENTRY_DSN` is set |
| <name>  | <push, payments, maps…> | <core module>         | <planned / live>              |

## Do Not Touch (needs explicit human approval)

- `src/core/api/httpClient.ts`, `src/core/auth/*` — session, refresh and error handling
- `ios/`, `android/`, `fastlane/`, `.github/workflows/`, `babel.config.js`, `metro.config.js`
- `eslint.config.mjs` architecture rules, `tsconfig.json`, coverage thresholds in `jest.config.js`
- <project-specific: modules under active work elsewhere, legacy areas being migrated>

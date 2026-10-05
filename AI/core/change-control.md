# Change control — creating, modifying, deleting and moving code

The codebase works and is tested. The job is to change it without breaking what's there or eroding its structure. "Make it better" is never permission to change more than asked.

## 1. Creating code

- **Look first.** Search for something that already does it (`@/ui` components, `@/core/*` APIs, `@/shared/utils`, the feature's own hooks). Extend it with a prop or option before writing a new one.
- **Put it in the right place** using the decision order in `AI/rules/architecture.md` §2. When in doubt, keep it inside the feature.
- **Follow the reference shape.** New feature → copy the structure of `src/features/feed/`. New UI component → copy an existing one in `src/ui/components/`.
- **Register it where the codebase expects** (`AI/rules/architecture.md` §4): routes in `RootNavigator`, keys in `keys.ts`, events in `analytics.ts`, strings in every locale.
- **Bring its test** in the same change.
- **No new top-level folders, barrels inside features, or "common/misc/helpers" folders.** Lint rejects files outside the known layers.

## 2. Modifying code

- **Smallest diff that works.** Targeted edits; never rewrite a whole file when a few lines change.
- **Match the surrounding style** even where you'd write it differently.
- **Keep signatures stable.** Changing a function's parameters, a component's props or a hook's return shape changes every caller: find them all by search first, list them in the plan, update them in the same change.
- **Behaviour changes are explicit.** If the change alters what the user sees or what the app sends or stores, say so in the plan.
- **Don't touch** formatting, imports order, comments or names outside your change. Prettier and lint will tell you if your own lines are off.

## 3. Deleting code

Needs approval unless the code was **created by you in this task** or became unused **because of your change**.

1. Prove it's unused: search for every import and string reference (including tests, mocks, `RootNavigator`, locale files, Maestro flows).
2. Delete the whole unit — component, its test, its locale keys, its mock, its route, its export from `index.ts`.
3. Run `npm run validate` (unused locale keys and imports show up there).

Pre-existing dead code you notice → mention it in your report; don't delete it.

## 4. Things you notice but weren't asked to fix

Bugs, smells, outdated docs, missing tests outside the change: **report them** under "Follow-ups". Fix one only if the user agrees — as its own change.

## 5. Moving code

Moves are refactors (`AI/playbooks/refactor.md`). Common, legitimate ones:

| Trigger                                           | Move to                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------- |
| A feature component is needed by a second feature | `src/ui/components/` (visual) or `src/core/<module>/` (technical) |
| A screen passes ~200 lines                        | Pieces into the feature's `components/` and `hooks/`              |
| Any file passes ~300 lines                        | Split by responsibility                                           |

Never import across features to avoid a move, and never copy-paste to avoid one.

## 6. Public contracts — change only with approval and a migration

Breaking these breaks installed apps, users' data or other systems, and tests won't always catch it.

| Contract                             | Where                                        | Safe change                                                                                  |
| ------------------------------------ | -------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Route names, deep-link paths         | `src/app/navigation/RootNavigator.tsx`       | Add new ones; keep old paths working (links live in emails, push payloads, QR codes)         |
| Persisted storage keys and shapes    | `src/core/storage/keys.ts`, persisted stores | New key, or bump `version` with a `migrate`; persisted queries → bump `CACHE_SCHEMA_VERSION` |
| Secure storage keys                  | `SecureKeys`                                 | Never rename — users would be signed out                                                     |
| Analytics event names and properties | `src/core/analytics/analytics.ts`            | Add; renaming breaks dashboards                                                              |
| Env var names                        | `.env.*`, `EnvSchema`, CI secrets            | Add; rename everywhere at once (`AI/playbooks/native-change.md`)                             |
| API requests and response schemas    | `features/*/api/*Api.ts`                     | Match the backend contract; never "fix" a schema to make a test pass                         |
| Feature flag names                   | `src/core/feature-flags/featureFlags.ts`     | Add; remove only after the remote config stops sending it                                    |
| App id, bundle id, URL schemes       | `.env.*`, native projects                    | Never after a store release                                                                  |

## 7. Generated and vendored files — never edit by hand

`ios/Config/Generated/*` (from `scripts/ios-env.mjs`), `ios/Pods/`, `vendor/`, `node_modules/`, `package-lock.json` (only via npm), `src/assets/bootsplash/*` (from the bootsplash generator), `coverage/`, `.reassure/`.

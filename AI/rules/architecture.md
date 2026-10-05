# Architecture rules

Why and diagrams: `docs/ARCHITECTURE.md`. Placement guide for humans: `docs/QUICK_GUIDE.md` §9. 🔒 = enforced by `npm run lint`.

## 1. Layers

```
src/
├── app/        composition root: bootstrap, providers, navigation, deep links, dev menu
├── features/   vertical slices: <feature>/{index.ts, mocks.ts, api/, hooks/, components/, screens/}
├── ui/         design system: theme + presentational, themed, accessible components
├── core/       infrastructure, one capability per folder: api, auth, storage, config, i18n, errors, …
├── shared/     pure utils and types — no React Native, no side effects
└── assets/     brand and generated splash assets
```

| From ↓ may import → | shared | core | ui  | own feature |        other feature         | app |
| ------------------- | :----: | :--: | :-: | :---------: | :--------------------------: | :-: |
| `shared`            |   ✅   |  ❌  | ❌  |      —      |              ❌              | ❌  |
| `core/*`            |   ✅   |  ✅  | ❌  |      —      |              ❌              | ❌  |
| `ui`                |   ✅   |  ✅  | ✅  |      —      |              ❌              | ❌  |
| `features/x`        |   ✅   |  ✅  | ✅  |     ✅      |              ❌              | ❌  |
| `app`               |   ✅   |  ✅  | ✅  |      —      | `index.ts` / `mocks.ts` only | ✅  |

🔒 Also enforced: vendor SDKs only inside their owning `core/` module (`VENDOR_OWNERS` in `eslint.config.mjs`); no import cycles; no files outside known layers; `@/…` alias instead of `../../`; named exports only.

## 2. Where new code goes — ask in this order

1. Used by **one feature** → inside that feature.
2. **Visual**, used by 2+ features → `src/ui/components/` (+ export in its `index.ts`).
3. **Technical** (IO, device, SDK), used by 2+ features → `src/core/<module>/` (+ `index.ts`).
4. **Pure** function or type, no React/device/app knowledge → `src/shared/utils/` or `src/shared/types/`.
5. Must know about **several features** (routes, startup, cross-feature composition) → `src/app/`.

When in doubt, keep it in the feature — moving down later is easy; un-sharing one-off code isn't.

## 3. Inside a feature

| Kind                              | File                                     |
| --------------------------------- | ---------------------------------------- |
| Endpoint functions + zod schemas  | `api/<feature>Api.ts`                    |
| Query-key factory                 | `api/<feature>Keys.ts`                   |
| Query/mutation hooks, logic hooks | `hooks/useX.ts` (never in the api file)  |
| Feature-only components           | `components/X.tsx`                       |
| Route components (thin)           | `screens/XScreen.tsx`                    |
| Feature-only helpers              | `utils.ts` (folder only when it grows)   |
| Dev mock endpoints                | `mocks.ts`                               |
| Public API (usually screens)      | `index.ts` — the only file others import |

## 4. Extension points — register things here, nowhere else

| Adding…                    | Edit                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------ |
| Screen / route / deep link | `src/app/navigation/RootNavigator.tsx` — every screen gets an explicit `linking` path                  |
| Cross-feature composition  | `src/app/` (pass components or callbacks in; features stay unaware of each other) — `docs/COOKBOOK.md` |
| Translation strings        | Every file in `src/core/i18n/locales/`, grouped by feature (`"orders": {…}`)                           |
| Storage key                | `StorageKeys` / `SecureKeys` in `src/core/storage/keys.ts`                                             |
| Persisted client store     | Zustand + `validatedPersistOptions`; user data resets via `onSessionEnded` (`AI/rules/data-layer.md`)  |
| Analytics event            | `AnalyticsEvents` in `src/core/analytics/analytics.ts`                                                 |
| Feature flag               | `FlagsSchema` in `src/core/feature-flags/featureFlags.ts`                                              |
| Env var                    | `AI/playbooks/native-change.md` §3 (four `.env.*` files + `EnvSchema` + test mock)                     |
| Theme colour role / token  | `src/ui/theme/themes.ts` / `tokens.ts` — generic roles only                                            |
| Backend error envelope     | `parseErrorBody` in `src/core/api/httpClient.ts` — once, for the whole API (hard stop)                 |
| Dev mock backend           | `features/<f>/mocks.ts` + register in `src/app/bootstrap/mocks.ts`                                     |
| Dev Menu tool              | `src/app/bootstrap/devMenu.ts` (dev builds only)                                                       |
| Permission                 | `ensurePermission` / `usePermission` from `@/core/permissions` + native usage strings                  |
| New vendor SDK             | A new `src/core/<module>/` facade + a `VENDOR_OWNERS` entry (`AI/rules/libraries.md`)                  |

## 5. Size limits

- Screen file ~200 lines → extract components and hooks.
- Any file ~300 lines → split by responsibility.
- Feature folder crowded → sub-folders inside it, or split into two features if they're separate products.

## 6. Never

- New top-level folders (`src/components`, `src/services`, `src/helpers`, `src/utils`, `src/constants`, `src/hooks`) or `common/`/`misc/` folders. 🔒
- Import another feature, or a feature's internal file from outside it. 🔒
- `fetch`/`http` calls in screens or components — they belong in `api/`, used through a hook.
- Repositories, services, DI containers, React contexts for data, or HOCs — endpoint functions + hooks are the abstraction.
- Copy-paste a component to change one thing — add a prop or variant.
- Server data in Zustand, or screen-specific colours in the theme.

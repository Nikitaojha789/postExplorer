# Quick Guide — understand Baseline in 15 minutes

Simple words, short steps. Read this first. The other docs in `docs/` go deeper when you need them.

---

## 1. What is this?

Baseline is a **ready-made starting point** for new React Native apps.

It already has the boring-but-important things done for you:
login and session handling, API calls, caching, offline handling, dark mode, translations (English + Arabic with right-to-left), error handling, logging, crash reporting, 4 environments (dev / qa / staging / prod), tests, linting, and CI.

It also has **3 example features** (`auth`, `feed`, `settings`) that show the right way to build things. Copy their patterns.

---

## 2. Start a new project from Baseline (first steps)

**Step 1 — Copy the folder**

Copy the `Boilerplate` folder to your new project folder. Delete the `.git` folder inside it, then start your own repo:

```bash
git init
```

**Step 2 — Install**

```bash
npm install
```

```bash
bundle install && npm run pods
```

**Step 3 — Run it**

```bash
npm run ios:dev
```

```bash
npm run android:dev
```

Log in with **any email** and password **`password`** (this is a fake "mock" server built into dev mode).

**Step 4 — Make it yours**

| What to change                                | Where                                                                                                                                                       |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App name shown on the phone                   | `APP_DISPLAY_NAME` in the four `.env.*` files                                                                                                               |
| Server (API) address                          | `API_URL` in the four `.env.*` files (see §6)                                                                                                               |
| Brand colours                                 | `src/ui/theme/tokens.ts` (the `palette` at the top)                                                                                                         |
| Splash screen logo                            | Run `npx react-native-bootsplash generate your-logo.png --platforms=android,ios --background=#FFFFFF --logo-width=96 --assets-output=src/assets/bootsplash` |
| Bundle id / package name (`com.postexplorer`) | Follow COOKBOOK.md → "Rename the app" (touches a few native files)                                                                                          |
| Remove example features you don't need        | Delete the folder in `src/features/`, remove its screen from `src/app/navigation/RootNavigator.tsx` and its line in `src/app/bootstrap/mocks.ts`            |

**Step 5 — Check everything still works**

```bash
npm run validate
```

This runs type checks, lint, formatting, translation checks and tests. Run it before every commit.

---

## 3. Where is everything? (the folder map)

Think of the app as **5 layers**, from top to bottom:

```
src/
├── app/        ① The "glue". Starts the app, sets up navigation. Knows about everything.
├── features/   ② Your product. One folder per feature (login, orders, profile…).
├── ui/         ③ Reusable look & feel: buttons, text, inputs, colours, dark mode.
├── core/       ④ Behind-the-scenes engine: API, login session, storage, translations, logging…
└── shared/     ⑤ Tiny pure helpers (functions with no app knowledge).
```

**The one rule:** a layer can only use layers **below** it.

- A feature can use `ui`, `core`, `shared` — but **never another feature**.
- `ui` can't use features. `core` can't use `ui`.

You don't need to remember this — **lint will tell you** if you break it, and the error message says what to use instead.

### Inside a feature (always the same shape)

```
src/features/orders/
├── index.ts          ← what other parts of the app may use (usually just the screens)
├── mocks.ts          ← (optional) fake API responses for dev mode
├── api/              ← talking to the server
│   ├── ordersApi.ts      the API calls + the data shape (schema)
│   └── ordersKeys.ts     cache names for this feature
├── hooks/            ← data logic used by screens (useOrders, useCancelOrder…)
├── components/       ← UI pieces only this feature uses
└── screens/          ← the screens (keep them simple)
```

### Where do I put…?

| I have…                                                    | Put it in                                                        |
| ---------------------------------------------------------- | ---------------------------------------------------------------- |
| A new screen                                               | `src/features/<feature>/screens/`                                |
| An API call                                                | `src/features/<feature>/api/`                                    |
| A UI piece used by **one** feature                         | `src/features/<feature>/components/`                             |
| A UI piece used by **many** features (button, card…)       | `src/ui/components/`                                             |
| Something technical used everywhere (storage, API engine…) | `src/core/`                                                      |
| A small pure helper function                               | `src/shared/utils/`                                              |
| A new route / navigation change                            | `src/app/navigation/RootNavigator.tsx`                           |
| Text the user sees                                         | `src/core/i18n/locales/en.json` **and** `ar.json`                |
| Colours, spacing, font sizes                               | `src/ui/theme/tokens.ts` / `themes.ts`                           |
| Settings per environment (URLs etc.)                       | `.env.development`, `.env.qa`, `.env.staging`, `.env.production` |

### Other folders at the root

| Folder                  | What's inside                                        |
| ----------------------- | ---------------------------------------------------- |
| `android/`, `ios/`      | Native projects (you rarely touch these)             |
| `docs/`                 | All the documentation                                |
| `test/`                 | Test helpers and fake versions of native modules     |
| `.maestro/`             | End-to-end tests (tap through the app automatically) |
| `scripts/`              | Helper scripts (translation check, iOS setup, clean) |
| `fastlane/`, `.github/` | Building and publishing to the stores, CI            |

---

## 4. How to create a new screen

Example: an "About" screen inside the existing `settings` feature.

**1. Create the screen file** — `src/features/settings/screens/AboutScreen.tsx`

```tsx
import { useTranslation } from 'react-i18next';

import { makeStyles, Screen, Text } from '@/ui';

export function AboutScreen() {
  const styles = useStyles();
  const { t } = useTranslation();

  return (
    <Screen preset="scroll" testID="about-screen">
      <Text variant="title2" style={styles.title}>
        {t('about.title')}
      </Text>
      <Text color="textSecondary">{t('about.body')}</Text>
    </Screen>
  );
}

const useStyles = makeStyles(({ spacing }) => ({
  title: { marginBottom: spacing.md },
}));
```

Notice:

- `Screen`, `Text` come from `@/ui` — **not** from `react-native` (lint blocks that).
- Text comes from `t('…')` — never type words directly in the screen.
- Styles use `makeStyles` + theme values — never hard-coded colours or sizes.

**2. Add the texts** to `src/core/i18n/locales/en.json` and `ar.json`:

```json
"about": { "title": "About", "body": "Made with Baseline." }
```

**3. Export it** — in `src/features/settings/index.ts`:

```ts
export { AboutScreen } from './screens/AboutScreen';
```

**4. Add it to navigation** — in `src/app/navigation/RootNavigator.tsx`, inside `SignedIn → screens`:

```ts
About: {
  screen: AboutScreen,
  options: () => ({ title: i18n.t('about.title') }),
  linking: 'about',            // optional: makes  baseline-dev://about  open it
},
```

**5. Open it from anywhere**

```ts
const navigation = useNavigation();
navigation.navigate('About');
```

Types are automatic — if you misspell `'About'` or forget a parameter, TypeScript tells you.

**Screen with parameters** (like a detail page):

```tsx
import type { StaticScreenProps } from '@react-navigation/native';

type Props = StaticScreenProps<{ id: string }>;

export function OrderDetailScreen({ route }: Props) {
  const { id } = route.params;
  // …
}
```

---

## 5. How to create a new feature (module) with an API

Example: an "orders" feature that loads a list from the server.

**1. Create the folders**

```
src/features/orders/{api,hooks,components,screens}
```

**2. Describe the data and the API call** — `src/features/orders/api/ordersApi.ts`

```ts
import { z } from 'zod';

import { http } from '@/core/api';

// The shape the server sends back. If the server sends something different,
// the app gets a clear error instead of crashing on a screen.
export const OrderSchema = z.object({
  id: z.string(),
  title: z.string(),
  total: z.number(),
});
export type Order = z.infer<typeof OrderSchema>; // the TypeScript type comes for free

export const ordersApi = {
  list: (signal?: AbortSignal) => http.get('/orders', { schema: z.array(OrderSchema), signal }),
  cancel: (id: string) =>
    http.post(`/orders/${encodeURIComponent(id)}/cancel`, { schema: OrderSchema }),
} as const;
```

You **don't** add the server address, token, language header, timeout or retry — `http` does all of that.

**3. Give the cache a name** — `src/features/orders/api/ordersKeys.ts`

```ts
export const ordersKeys = {
  all: ['orders'] as const,
  list: () => [...ordersKeys.all, 'list'] as const,
};
```

**4. Create the hooks** — `src/features/orders/hooks/useOrders.ts`

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ordersApi } from '../api/ordersApi';
import { ordersKeys } from '../api/ordersKeys';

// Read data: caching, loading state, retry, offline — all automatic.
export const useOrders = () =>
  useQuery({ queryKey: ordersKeys.list(), queryFn: ({ signal }) => ordersApi.list(signal) });

// Change data: after success, refresh the list.
export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ordersApi.cancel,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ordersKeys.all }),
  });
};
```

**5. Use it in a screen** — always handle loading / error / empty:

```tsx
export function OrdersScreen() {
  const { data, error, isPending, refetch } = useOrders();

  if (isPending) return <LoadingState />;
  if (error && !data) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <Screen padded={false}>
      <FlashList
        data={data}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <OrderRow order={item} />}
        ListEmptyComponent={<EmptyState title={t('orders.empty')} />}
      />
    </Screen>
  );
}
```

For long lists always use **FlashList** (not `FlatList`, not `ScrollView` + `.map`). Copy `src/features/feed/screens/FeedScreen.tsx` — it's the full example with pull-to-refresh and "load more".

**6. Export + add to navigation** — same as §4 steps 3–4.

**7. (Optional) Fake data for dev mode** — `src/features/orders/mocks.ts`:

```ts
import { registerMockRoute } from '@/core/api/mock';

export const registerOrdersMocks = () => {
  registerMockRoute('GET', '/orders', () => ({
    body: [{ id: '1', title: 'First order', total: 42 }],
  }));
};
```

Then add `registerOrdersMocks();` in `src/app/bootstrap/mocks.ts`. Mocks only exist in dev builds — they are removed from release builds automatically.

---

## 6. How to change the server URL (and other settings)

All settings live in **4 files** at the project root — one per environment:

| File               | Used by                           |
| ------------------ | --------------------------------- |
| `.env.development` | `npm run ios:dev` / `android:dev` |
| `.env.qa`          | QA builds                         |
| `.env.staging`     | Staging builds                    |
| `.env.production`  | Store builds                      |

To point the app at your real server:

```
API_URL=https://api.yourcompany.com/v1
USE_MOCK_API=false
```

Then **rebuild the app** (`npm run ios:dev` / `npm run android:dev`). Just reloading JavaScript is **not** enough — these values are baked in when the app is built.

⚠️ Everything in `.env.*` ends up inside the app and can be read by anyone. **Never put secrets** (passwords, private API keys) there.

**Add a new setting:**

1. Add the line to **all 4** `.env.*` files.
2. Add it to the list in `src/core/config/env.ts` (this checks the value is valid when the app starts).
3. Use it: `import { env } from '@/core/config'; env.MY_SETTING`.

**If your server's error format is different** (e.g. `{ "error_message": "…" }`), adjust `parseErrorBody` once in `src/core/api/httpClient.ts`. Every feature benefits.

**If your login/refresh endpoints are different**, adjust `src/features/auth/api/authApi.ts` (sign-in) and `REFRESH_PATH` + `TokenPairSchema` in `src/core/auth/` (token refresh).

---

## 7. Everyday "how do I…?"

| I want to…                        | Do this                                                                                                     |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Show text                         | `<Text variant="body">{t('key')}</Text>` from `@/ui`                                                        |
| Show a button                     | `<Button title={t('key')} onPress={…} loading={isPending} />`                                               |
| Show an input                     | `<TextField label={t('key')} … />` (with react-hook-form — see `SignInScreen.tsx`)                          |
| Show an image                     | `<Image source={url} style={{ width: 56, height: 56 }} accessibilityLabel={null} />` from `@/ui`            |
| Show a short message              | `toast.success(t('key'))` from `@/ui`                                                                       |
| Show a loading placeholder        | `<Skeleton height={56} />` from `@/ui` (one per row, shaped like the content)                               |
| Show filter/sort chips            | `<ChipRow>{options.map(o => <Chip key={o} label={…} value={o} selected={…} onPress={select} />)}</ChipRow>` |
| Group settings-style rows         | `<Section title={t('key')}>…ListRows…</Section>` from `@/ui`                                                |
| Search field above a list         | `<Screen avoidKeyboard>` (see COOKBOOK.md → "Keyboard on a list screen")                                    |
| Save data that belongs to a user  | Zustand + `validatedPersistOptions` (see COOKBOOK.md → "Persist a client store")                            |
| Test offline / slow network       | Dev Menu → `Network:` entries (see COOKBOOK.md → Debugging)                                                 |
| Use theme colours                 | `makeStyles(({ colors, spacing }) => ({ box: { backgroundColor: colors.surface, padding: spacing.lg } }))`  |
| Know if user is logged in         | `useSessionStatus()` / `useSessionUser()` from `@/core/auth`                                                |
| Log something                     | `logger.info('message', { data })` from `@/core/logger` (never `console.log`)                               |
| Track an analytics event          | Declare it in `src/core/analytics/analytics.ts`, then `analytics.track('event_name', { … })`                |
| Save a small setting on the phone | Add a key to `src/core/storage/keys.ts`, use `appStorage.setString(...)`                                    |
| Save a secret (token)             | `secureStorage.set(...)` from `@/core/storage`                                                              |
| Ask for a permission              | See COOKBOOK.md → "Request a permission"                                                                    |
| Add a language                    | See COOKBOOK.md → "Add a translation language"                                                              |
| Switch a feature on/off remotely  | See COOKBOOK.md → "Add a feature flag"                                                                      |

---

## 8. Code rules in one minute

1. **Use `@/ui` components**, not raw `react-native` ones (`Text`, `TextInput`, `Image`, `FlatList`, `TouchableOpacity`…). Lint tells you the replacement.
2. **No hard-coded text, colours or sizes.** Text → `t()`, colours/sizes → theme.
3. **Features never import other features.**
4. **Every API call has a zod schema.**
5. **Server data → TanStack Query hooks.** Never copy server data into a global store.
6. **Every screen handles loading, error, empty** (and works offline with cached data).
7. **Use start/end, not left/right** (`marginStart`, `paddingEnd`, `align="start"`) so Arabic works.
8. **No `any`, no `console.log`, no `!` (non-null assertions).**
9. **Named exports only** (`export function X`), no `export default`.
10. **File names:** `PascalCase.tsx` for components/screens (`OrderRow.tsx`, `OrdersScreen.tsx`), `useX.ts` for hooks, `camelCase.ts` for everything else, `kebab-case` for folders.

Full list: [CODING_STANDARDS.md](./CODING_STANDARDS.md).

## 9. Keep the structure clean (no mess, ever)

The structure only stays clean if **everyone puts things in the same place**. Use this section every time you create a file.

### 9.1 Ask these 4 questions — in this order

```
1. Is it used by only ONE feature?
      → put it INSIDE that feature   (src/features/<feature>/...)

2. Is it a visual piece (button, card, badge) used by 2+ features?
      → src/ui/components/

3. Is it technical / talks to the device or an SDK (storage, API engine, permissions…) and used by 2+ features?
      → src/core/<module>/

4. Is it a small pure function or type (no React, no device, no app knowledge)?
      → src/shared/utils/  or  src/shared/types/

Needs to know about several features at once (navigation, startup)?
      → src/app/
```

**When in doubt, keep it inside the feature.** It's easy to move something down later; it's hard to clean up a shared folder full of one-off code.

### 9.2 Exact place for every kind of file

| Kind of file                   | Goes in                                                          | Name it                 |
| ------------------------------ | ---------------------------------------------------------------- | ----------------------- |
| Screen                         | `features/<f>/screens/`                                          | `OrdersScreen.tsx`      |
| Feature-only component         | `features/<f>/components/`                                       | `OrderRow.tsx`          |
| API calls + data schemas       | `features/<f>/api/<f>Api.ts`                                     | `ordersApi.ts`          |
| Cache keys                     | `features/<f>/api/<f>Keys.ts`                                    | `ordersKeys.ts`         |
| Data hooks (queries/mutations) | `features/<f>/hooks/`                                            | `useOrders.ts`          |
| Feature-only helper            | `features/<f>/utils.ts` (or `utils/` if it grows)                | `formatOrderStatus.ts`  |
| Feature-only types             | next to the code that uses them (or `features/<f>/types.ts`)     | —                       |
| Fake dev data                  | `features/<f>/mocks.ts`                                          | —                       |
| Public exports of a feature    | `features/<f>/index.ts`                                          | —                       |
| Shared UI component            | `ui/components/` + export in `ui/components/index.ts`            | `Badge.tsx`             |
| Colours, spacing, fonts        | `ui/theme/tokens.ts` / `themes.ts`                               | —                       |
| App-wide infrastructure        | `core/<module>/` + export in its `index.ts`                      | `core/notifications/`   |
| Pure helper                    | `shared/utils/` + export in `shared/utils/index.ts`              | `formatCurrency.ts`     |
| Translations                   | `core/i18n/locales/*.json` (grouped by feature: `"orders": {…}`) | —                       |
| Storage keys                   | `core/storage/keys.ts`                                           | —                       |
| Analytics events               | `core/analytics/analytics.ts`                                    | —                       |
| Feature flags                  | `core/feature-flags/featureFlags.ts`                             | —                       |
| Routes                         | `app/navigation/RootNavigator.tsx`                               | —                       |
| Tests                          | next to the file they test                                       | `OrdersScreen.test.tsx` |
| Images / fonts                 | `src/assets/images/`, `src/assets/fonts/`                        | `empty-orders.png`      |
| Environment settings           | `.env.development/.qa/.staging/.production`                      | `UPPER_SNAKE_CASE`      |

### 9.3 Moving things when they grow

- A feature component is now needed by a **second** feature → **move it** to `ui/components/` (if visual) or `core/` (if technical). Don't import it from the other feature, and don't copy-paste it.
- A screen file passes ~200 lines → move pieces into `components/` and logic into `hooks/`.
- Any file passes ~300 lines → split it by responsibility.
- A feature folder gets big → add sub-folders inside it (`components/cart/`, `hooks/cart/`), or split it into two features if they are really separate products.

### 9.4 Never do this (these are how projects get messy)

| ❌ Don't                                                                                                                | ✅ Do instead                                                                                                         |
| ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Create new top-level folders in `src/` (`src/helpers`, `src/services`, `src/components`, `src/utils`, `src/constants`…) | Use the 5 existing layers (lint rejects files outside them). If something truly doesn't fit, discuss it in a PR first |
| Create a "common" or "misc" folder inside a feature                                                                     | Use `components/`, `hooks/`, `api/`, `utils.ts`                                                                       |
| Import from another feature (`@/features/feed/...` inside `orders`)                                                     | Move the shared part down to `ui/`, `core/` or `shared/`                                                              |
| Import a feature's internal file from outside (`@/features/feed/hooks/useFeed`)                                         | Export it in the feature's `index.ts` (only if `app/` needs it)                                                       |
| Call `fetch` / `http` from a screen or component                                                                        | Put the call in `api/`, use it through a hook                                                                         |
| Put server data into a Zustand store                                                                                    | Use a TanStack Query hook                                                                                             |
| Add screen-specific colours to the theme (`ordersHeaderBlue`)                                                           | Use existing semantic colours; add a new one only if it's generic                                                     |
| Write storage keys, routes or event names as plain strings in many places                                               | Add them once to their central file (keys.ts, navigator, analytics.ts)                                                |
| Copy-paste a component to change one thing                                                                              | Add a prop / variant to the existing component                                                                        |
| Leave dead code, commented-out code, or unused files                                                                    | Delete them — git remembers                                                                                           |
| Add a new library without checking                                                                                      | Check DEPENDENCIES.md first and add a row for the new one                                                             |

### 9.5 What protects the structure for you

**Checked automatically** (lint fails, so it can't be merged):

- Every file in `src/` belongs to a known layer — no new top-level folders.
- Layers only import downward; features never import each other.
- Outside a feature, only its `index.ts` can be imported.
- Vendor libraries (MMKV, Keychain, Sentry, NetInfo…) can only be used inside their `core/` module.
- Raw `react-native` components that have a `@/ui` version are blocked.
- No `../../` imports, no circular imports, no `export default`, no `console.log`, fixed import order.
- Translation files must have the same keys.

**Checked by reviewers** (lint can't see these — look for them in every PR):

- Is each new file in the right place (table 9.2)?
- Did a "shared" thing get created for only one user? (keep it in the feature)
- Did something get copy-pasted instead of moved down?
- File names follow the naming rules?
- Any file or screen too big (9.3)?

---

## 10. Before you commit

```bash
npm run validate
```

Then check:

- [ ] Tried it on **iOS and Android**
- [ ] Looks right in **light and dark** mode
- [ ] New texts added to **every** language file
- [ ] Loading / error / empty states work

Commit messages follow this format (checked automatically):

```
feat(orders): add order list screen
fix(auth): handle expired session on resume
```

Git hooks run lint and formatting on the files you changed, and a type check before push.

---

## 11. Useful commands

| Command                                   | What it does                                             |
| ----------------------------------------- | -------------------------------------------------------- |
| `npm start`                               | Start Metro (the JS server)                              |
| `npm run ios:dev` / `android:dev`         | Build & run the dev app                                  |
| `npm run ios:staging` / `android:staging` | Run a staging build                                      |
| `npm run pods`                            | Install iOS dependencies (after adding a native library) |
| `npm test`                                | Run tests                                                |
| `npm run validate`                        | Everything that CI checks                                |
| `npm run lint:fix` / `npm run format`     | Auto-fix style problems                                  |
| `npm run clean`                           | Delete caches and builds when things get weird           |

**Something broken?** Try in this order: `npm start -- --reset-cache` → rebuild the app → `npm run clean && npm install && npm run pods`.

---

## 12. Where to read more

| Question                            | Doc                                                            |
| ----------------------------------- | -------------------------------------------------------------- |
| Why is it built this way?           | [ARCHITECTURE.md](./ARCHITECTURE.md)                           |
| Why this library and not that one?  | [DECISIONS.md](./DECISIONS.md)                                 |
| All the code rules                  | [CODING_STANDARDS.md](./CODING_STANDARDS.md)                   |
| Making the app fast                 | [PERFORMANCE.md](./PERFORMANCE.md)                             |
| More step-by-step recipes           | [COOKBOOK.md](./COOKBOOK.md)                                   |
| Environments, signing, releases     | [ENVIRONMENTS_AND_RELEASES.md](./ENVIRONMENTS_AND_RELEASES.md) |
| What each package does              | [DEPENDENCIES.md](./DEPENDENCIES.md)                           |
| Moving an old project onto Baseline | [MIGRATION_FROM_REFERENCE.md](./MIGRATION_FROM_REFERENCE.md)   |

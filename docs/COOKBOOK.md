# Cookbook

Step-by-step recipes for the things you'll do most. Each follows the architecture rules; the `feed` feature is the reference implementation.

---

## Add a feature

```
src/features/orders/
├── index.ts                 # export { OrdersScreen, OrderDetailScreen }
├── mocks.ts                 # optional: registerOrdersMocks()
├── api/
│   ├── ordersApi.ts         # endpoint functions + zod schemas
│   └── ordersKeys.ts        # query-key factory
├── hooks/useOrders.ts       # useQuery / useMutation wrappers
├── components/OrderRow.tsx  # memo'd list row
└── screens/OrdersScreen.tsx
```

1. **API** — define schemas once, infer types, call `http` with `schema` and `signal`:

   ```ts
   export const OrderSchema = z.object({
     id: z.string(),
     total: z.number(),
     status: z.enum(['open', 'shipped']),
   });
   export type Order = z.infer<typeof OrderSchema>;

   export const ordersApi = {
     list: (signal?: AbortSignal) => http.get('/orders', { schema: z.array(OrderSchema), signal }),
     cancel: (id: string) =>
       http.post(`/orders/${encodeURIComponent(id)}/cancel`, { schema: OrderSchema }),
   } as const;
   ```

2. **Keys** — `export const ordersKeys = { all: ['orders'] as const, list: () => [...ordersKeys.all, 'list'] as const };`

3. **Hooks** — in `hooks/`, never in the same module as the endpoint object (a hook that closes over the real `ordersApi` can't be reached by `jest.mock('../api/ordersApi')`). Queries own keys/select/meta; mutations update the cache:

   ```ts
   export const useOrders = () =>
     useQuery({ queryKey: ordersKeys.list(), queryFn: ({ signal }) => ordersApi.list(signal) });

   export const useCancelOrder = () => {
     const queryClient = useQueryClient();
     return useMutation({
       mutationFn: ordersApi.cancel,
       onSuccess: () => queryClient.invalidateQueries({ queryKey: ordersKeys.all }),
     });
   };
   ```

4. **Screen** — compose hook + `FlashList` + `LoadingState/ErrorState/EmptyState` (copy `FeedScreen`).
5. **Strings** — add keys to every file in `src/core/i18n/locales/`.
6. **Route** — register in `src/app/navigation/RootNavigator.tsx` (with a `linking` path if it should be deep-linkable). Screen params: `type Props = StaticScreenProps<{ id: string }>`.
7. **Mocks (optional)** — `features/orders/mocks.ts` + call it from `src/app/bootstrap/mocks.ts`.
8. **Tests** — screen test with `renderWithProviders` + mocked `ordersApi`; Reassure test if it's a long list. A request that isn't mocked fails the test immediately and names the URL (`jest.setup.ts`).

## Add a screen to an existing navigator

```ts
// RootNavigator.tsx → SignedIn.screens
OrderDetail: {
  screen: OrderDetailScreen,
  options: () => ({ title: i18n.t('orders.detailTitle') }),
  linking: { path: 'orders/:id', parse: { id: String } },
},
```

Navigate (fully typed, no imports from `app/` needed): `navigation.navigate('OrderDetail', { id })`.

## Add an endpoint that needs special handling

| Need                       | How                                                                            |
| -------------------------- | ------------------------------------------------------------------------------ |
| Public endpoint (no token) | `http.post(path, { auth: false, … })`                                          |
| Upload                     | Pass `FormData` as `body` (Content-Type set automatically), longer `timeoutMs` |
| Different error envelope   | Adapt `parseErrorBody` in `core/api/httpClient.ts` once for the whole API      |
| Awkward DTO                | zod `.transform()` in the schema → components get a clean shape                |
| Large payload              | Consider validating a sample in production; keep full validation in dev/QA     |

## Add a design-system component

Put it in `src/ui/components/`, export from `src/ui/components/index.ts`. It must be: themed via `makeStyles`, accessible (role, label, 48dp target), RTL-safe (logical props), translation-agnostic (receives strings), and `memo`'d if used in lists.

## Add a translation language

1. `src/core/i18n/locales/<code>.json` (copy `en.json`, translate; include the language's plural forms).
2. Register in `resources.ts` and `SUPPORTED_LANGUAGES` (`direction: 'ltr' | 'rtl'`).
3. Add plural locale data in `src/app/bootstrap/polyfills.ts` (`@formatjs/intl-pluralrules/locale-data/<code>.js`).
4. `npm run i18n:check`.

## Persist a client store (cart, drafts, recent searches)

1. Key in `src/core/storage/keys.ts` (`StorageKeys`).
2. Pick the storage: `userStorage` for anything about the signed-in user (wiped on sign-out), `appStorage` for device-level settings that survive sign-out.
3. Create the store with `validatedPersistOptions`. Rehydrated data is validated by the schema (corrupt or old data → initial state), and MMKV hydrates synchronously, so the first render already has the data:

   ```ts
   const CartSchema = z.object({ items: z.array(CartItemSchema) });
   type CartState = z.infer<typeof CartSchema> & { add: (item: CartItem) => void };
   const initialState = { items: [] };

   export const useCartStore = create<CartState>()(
     persist(
       set => ({ ...initialState, add: item => set(s => ({ items: [...s.items, item] })) }),
       validatedPersistOptions({
         key: StorageKeys.cart,
         store: userStorage,
         schema: CartSchema,
         partialize: ({ items }) => ({ items }),
       }),
     ),
   );
   ```

4. **User data must reset on sign-out.** Wiping `userStorage` isn't enough: the in-memory store would write the previous user's data back on its next update. Register once, next to the store:

   ```ts
   onSessionEnded(() => useCartStore.setState(initialState)); // from @/core/auth
   ```

5. Changing the persisted shape: bump `version`. Without a `migrate` function, old data is dropped; with one, it's upgraded and then validated.

A single small value (theme, language) can skip Zustand persistence: read it with `appStorage.getObject(key, schema)`, as `ui/theme/themePreference.ts` does.

## Request a permission

```ts
const camera = usePermission(
  Platform.select({ ios: PERMISSIONS.IOS.CAMERA, default: PERMISSIONS.ANDROID.CAMERA }),
);
// Explain why in your UI first, then:
const status = await camera.request();
if (status === RESULTS.BLOCKED) void camera.openSettings();
```

Native setup: add `'Camera'` to `setup_permissions` in `ios/Podfile` + `NSCameraUsageDescription` in `Info.plist`; add `<uses-permission android:name="android.permission.CAMERA" />` to `AndroidManifest.xml`. Then `npm run pods`.

## Track an analytics event

Declare it in `AnalyticsEvents` (`core/analytics/analytics.ts`), then `analytics.track('order_cancelled', { reason })`. Plug a vendor once in bootstrap: `setAnalyticsProvider(myAmplitudeAdapter)`.

## Add a feature flag

Add to `FlagsSchema` + `DEFAULT_FLAGS` in `core/feature-flags/featureFlags.ts`; read with `useFeatureFlag('name')`. Feed remote values through `applyRemoteFlags(payload)` after first render.

## Enable Sentry

1. Set `SENTRY_DSN` in the relevant `.env.*` files.
2. For symbolicated stack traces in CI: `SENTRY_AUTH_TOKEN` secret + `ios/sentry.properties` (`defaults.org`, `defaults.project`) / Android `sentry.properties` or env vars `SENTRY_ORG`, `SENTRY_PROJECT`.
3. Verify with a test crash in a staging build.

## Push notifications (opt-in)

1. Firebase project per environment; `google-services.json` in `android/app/src/<flavor>/`, `GoogleService-Info.plist` per configuration.
2. `@react-native-firebase/app` + `@react-native-firebase/messaging` v26 (**modular API only**, New Architecture only).
3. Prompt with `ensureNotificationPermission()` (`core/permissions`) at a meaningful moment, not at launch. Android 13+ needs `POST_NOTIFICATIONS` in the manifest.
4. Local/foreground display: `expo-notifications` (requires Expo modules) or `react-native-notify-kit` (Notifee-compatible fork). Notifee itself is archived.
5. Wrap it in `core/notifications/` with a small facade (token registration, foreground handler, tap → `navigationRef` deep link) — same pattern as `core/monitoring`.

## Encrypted MMKV (opt-in)

For caches that may hold personal data: generate a 32-byte key with a CSPRNG (`react-native-quick-crypto` or a tiny native module — RN 0.87 has no `crypto.getRandomValues`), store it with `secureStorage`, and create the store with `createMMKV({ id: 'secure', encryptionKey, encryptionType: 'AES-256' })` inside `core/storage`. If the key is missing but the file exists (restore from backup), delete and recreate the store.

## Add a local database (opt-in)

`@op-engineering/op-sqlite` + `drizzle-orm/op-sqlite`, wrapped in `core/database/`. Use when you need relational queries, large datasets, full-text search or offline-first sync — not for simple caching (TanStack + MMKV covers that).

## Compose features without importing each other

Features can't import each other (lint-enforced). When one screen needs another feature's UI or data:

- **UI from another feature → a slot filled in `app/`.** The product screen takes a render prop, and the navigator wires the cart's component into it:

  ```tsx
  // features/catalog: ProductScreen({ renderPurchaseBar }: { renderPurchaseBar?: (id: string) => ReactNode })
  // app/navigation: screen: (props) => <ProductScreen {...props} renderPurchaseBar={id => <AddToCartBar id={id} />} />
  ```

- **Glue that belongs to no feature → a small component in `app/`**, e.g. a tab label with a cart badge (`app/navigation/TabLabel.tsx`) that reads the cart store's public hook.
- **The same server data in two or more features** (e.g. the current user's profile) → move its endpoint, key factory and hook into `src/core/<name>/`. Both features then share one query key: one cache entry, one request.

## Guest browsing with sign-in on demand (optional)

The reference navigator gates hard: signed-out users see only `SignedOut`. To let guests browse and ask for sign-in only when needed (e.g. at checkout):

```ts
const RootStack = createNativeStackNavigator({
  groups: {
    Shared: { screens: { Main: …, Product: … } },                       // no `if:` → always available
    SignedIn: { if: useIsSignedIn, screens: { Checkout: …, Orders: … } },
    SignedOut: {
      if: useIsSignedOut,
      screenOptions: { presentation: 'modal' },
      screens: { SignIn: { screen: SignInScreen, linking: 'sign-in' } },
    },
  },
});
```

- Ask for sign-in with `navigation.navigate('SignIn')`. When the session flips, React Navigation removes the modal and the user is back where they were.
- Every screen still needs an explicit `linking` path (`linking.test.ts` fails otherwise).
- Screens reachable by guests must handle "no session" themselves (`useIsSignedIn()`). Settings already hides "Sign out" for guests.

## Keyboard on a list screen (search, chat)

`Screen preset="scroll"` handles the keyboard, but a FlashList must never go inside it. For a list under an input, use the fixed preset with `avoidKeyboard`. The content shrinks above the keyboard, so the last result can be scrolled into view, on iOS and Android, below headers and above tab bars:

```tsx
<Screen padded={false} avoidKeyboard>
  <TextField label={t('search.label')} … />
  <FlashList … keyboardShouldPersistTaps="handled" />
</Screen>
```

## Bottom sheets & modals

Prefer native: `presentation: 'formSheet'` (with `sheetAllowedDetents`) or `'modal'` on a native-stack screen. They're accessible, gesture-correct and free of JS-thread work.

## Rename the app / change bundle id

1. Android: `namespace`/`applicationId` in `android/app/build.gradle`, package directories under `android/app/src/main/java/`, `build_config_package` resValue, ProGuard keep rule.
2. iOS: target/project names are best changed in Xcode; update `PRODUCT_BUNDLE_IDENTIFIER` base in `scripts/ios-configure-project.rb` and `APP` constant, then `npm run ios:configure && npm run pods`.
3. `app.json` `name`, `fastlane/Fastfile` `BASE_ID`, Maestro `appId`, `.env.*` display names, `SERVICE_PREFIX` in `secureStorage.ts`.

## Debugging

- **React Native DevTools** (press `j` in Metro or use the Dev Menu): console, sources/breakpoints, React components & profiler, network (0.83+), performance panel.
- JS `console.*` output appears in DevTools, **not** in the Metro terminal (RN ≥0.77).
- Optional: [Rozenite](https://github.com/callstackincubator/rozenite) DevTools plugins (TanStack Query, MMKV, network, navigation) — dev-only.
- Release-only issues: build `android:staging` / `ios:staging`; bundling errors (Babel/syntax) appear only in release.
- **Bad network, offline and token expiry on a simulator:** open the Dev Menu (Cmd+D on iOS, Cmd+M on Android) and use the `Network:` and `Auth:` entries (`app/bootstrap/devMenu.ts`). They toggle simulated offline (queries pause, the offline banner shows, requests fail), cycle added latency (up to 20 s, beyond the request timeout) and 30% failures, and expire the access token to exercise 401 → refresh → retry. They work against the mock API and real backends. Dev builds only.

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

3. **Hooks** — queries own keys/select/meta; mutations update the cache:

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
8. **Tests** — screen test with `renderWithProviders` + mocked `ordersApi`; Reassure test if it's a long list.

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

## Add a persisted preference

1. Key in `src/core/storage/keys.ts` (`StorageKeys`).
2. Small Zustand store initialised from `appStorage` (survives sign-out) or `userStorage` (wiped on sign-out); validate with zod via `getObject`. See `ui/theme/themePreference.ts`.

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

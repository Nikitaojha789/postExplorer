# Data layer rules — API, server state, client state, storage

Why: `docs/ARCHITECTURE.md` §4. Recipes: `docs/COOKBOOK.md`. Reference implementation: `src/features/feed/`.

## 1. Which state goes where

| State                                | Tool                                                  | Never                                    |
| ------------------------------------ | ----------------------------------------------------- | ---------------------------------------- |
| Anything from a server               | TanStack Query (feature hook)                         | Copy it into Zustand, `useState` or MMKV |
| Small global client state            | Zustand store, read with selectors                    | Use for server data or per-screen state  |
| Persisted preferences                | `appStorage` + `StorageKeys`                          | String-literal keys                      |
| Persisted client data (cart, drafts) | Zustand + `validatedPersistOptions` on `userStorage`  | Persist without a schema                 |
| Secrets (refresh token)              | `secureStorage` (Keychain/Keystore) via `@/core/auth` | Put any token in MMKV or a store         |
| Form state                           | react-hook-form + zod resolver                        | Mirror fields into `useState`            |
| Local UI state                       | `useState` / `useReducer`                             | Lift to global without a second consumer |
| Derived values                       | Compute during render                                 | Store them, or sync them with an effect  |

## 2. Endpoints — `features/<f>/api/<f>Api.ts`

```ts
export const OrderSchema = z.object({ id: z.string(), total: z.number().int() });
export type Order = z.infer<typeof OrderSchema>;

export const ordersApi = {
  list: (signal?: AbortSignal) => http.get('/orders', { schema: z.array(OrderSchema), signal }),
  cancel: (id: string) =>
    http.post(`/orders/${encodeURIComponent(id)}/cancel`, { schema: OrderSchema }),
} as const;
```

- One endpoint = one function on the feature's `<f>Api` object, using `http` from `@/core/api`. Never `fetch`, never axios.
- **Always pass a zod `schema`** — the cache only holds validated data; drift becomes `AppError{kind:'parse'}`, reported to monitoring.
- **Always thread `signal`** from TanStack so leaving a screen cancels the request.
- `encodeURIComponent` every path segment from data; use the `query` option for query strings.
- Awkward backend DTOs → `.transform()` in the schema; components never see raw DTO quirks.
- Options: `auth: false` (public endpoint), `timeoutMs` (uploads), `body` (JSON, or `FormData` for multipart), `headers`.
- Backend error envelope is parsed once in `parseErrorBody` (`core/api/httpClient.ts`) — don't parse errors per endpoint.

## 3. Queries — `features/<f>/hooks/`

- Keys only from the feature's factory (`ordersKeys.list()`, `ordersKeys.detail(id)`); no inline arrays.
- Hooks live in `hooks/`, never in the api file (or `jest.mock('../api/ordersApi')` can't reach them).
- Defaults (`core/api/queryClient.ts`): `staleTime` 30s, retries only for retryable errors (network, timeout, 429, 5xx), max 2. Override per query only with a reason (static data → `staleTime: Infinity`).
- Infinite lists: `useInfiniteQuery` with `initialPageParam` + `getNextPageParam`; flatten with a **module-level** `select`. No `maxPages` unless `docs/PERFORMANCE.md` §3 conditions are met.
- Detail screens: `placeholderData` from the list cache so they paint instantly (`useFeedItem`).
- Persist to disk only with `meta: { persist: true }`, only non-sensitive data, and bump `CACHE_SCHEMA_VERSION` (`core/api/queryPersistence.ts`) when a persisted shape changes.
- Refetch on screen focus with `useRefreshOnFocus` where freshness matters.
- Prefetch on intent (press-in): `queryClient.prefetchQuery` + `preloadImages`.

## 4. Mutations

- `useMutation` in a feature hook; never auto-retried (not idempotent).
- `onSuccess`: `invalidateQueries` via the key factory, or `setQueryData` for an exact update. Optimistic updates must roll back in `onError`.
- Disable the trigger while `isPending` to block double submits.
- Errors are reported centrally (`MutationCache.onError`); the screen shows `t(errorMessageKey(error))` or field errors from `AppError.fieldErrors`.

## 5. Zustand

- `create<State>()(() => ({ … }))` — exported hook plus small named actions; no store instances passed through props or context.
- Read with the smallest selector: `useStore(s => s.status)`. Never `useStore()` or `useStore(s => s)`. Selectors returning new objects/arrays need `useShallow` (`zustand/react/shallow`).
- No fast-changing values (scroll position, timers, keystrokes) in global stores.

## 6. Storage

- `appStorage` (survives sign-out: theme, language, flags) vs `userStorage` (wiped on sign-out: user data). Both MMKV, synchronous, **unencrypted**.
- Keys only from `StorageKeys` / `SecureKeys` in `core/storage/keys.ts`.
- Persisted Zustand stores use `validatedPersistOptions({ key, store: userStorage, schema, version, migrate? })`: rehydrated data is schema-checked; a shape change bumps `version` and provides `migrate`, or the store starts fresh.
- User-data stores reset on sign-out by registering with `onSessionEnded` from `@/core/auth`.
- Only `core/storage` imports MMKV or Keychain directly. 🔒

## 7. Session and auth state

- `startSession(tokens, user)` after sign-in; `endSession(reason)` to sign out. Both from `@/core/auth`.
- Read session with `useIsSignedIn`, `useSessionStatus`, `useSessionUser`.
- **Never navigate after sign-in or sign-out** — `RootNavigator` swaps stacks via `if:` groups when the session flips.
- Access token lives in memory only; refresh is single-flight in the HTTP client. Never handle 401s in features.

## 8. Forms

- react-hook-form + `zodResolver(schema)`; schema next to the form; messages are i18n keys.
- Map server `AppError.fieldErrors` onto form fields with `setError`.
- Submit with the mutation; disable while pending; keep the keyboard flow (return key → next field → submit).

## 9. Offline and network

- Queries pause offline (`networkMode: 'online'`) and resume on reconnect; cached data stays on screen. Don't add custom offline checks before requests.
- `useIsOnline()` from `@/core/network` only to change UI (disable a submit, show a hint); the global offline banner already exists.

## 10. Dev mocks

- Mock endpoints in `features/<f>/mocks.ts`, registered in `src/app/bootstrap/mocks.ts`; active only in `__DEV__` with `USE_MOCK_API=true`, and stripped from release bundles.
- Mocks follow the real contract in `AI/project/context.md`. Never shape a schema around a mock.

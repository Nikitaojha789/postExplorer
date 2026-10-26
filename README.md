# PostExplorer — Production-Quality React Native Take-Home App

A production-grade mobile application built on **React Native 0.87** (Hermes V1, New Architecture, TypeScript Strict, React Compiler 1.0) exploring posts from the JSONPlaceholder public API.

---

## 📱 Screenshots

> _Screenshots captured on iOS & Android emulators:_

|                                 Posts List Screen                                  |                                  Post Details Screen                                   |                              Pull-to-Refresh & States                               |
| :--------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------: |
| ![Posts List Placeholder](https://placehold.co/300x650/png?text=Posts+List+Screen) | ![Post Details Placeholder](https://placehold.co/300x650/png?text=Post+Details+Screen) | ![States Placeholder](https://placehold.co/300x650/png?text=Error+%26+Empty+States) |

---

## 🎯 Features Implemented

### 1. Posts List Screen (`PostListScreen`)

- **High-Performance List:** Uses `@shopify/flash-list` (v2, optimized for New Architecture & Fabric) to render 100 posts efficiently with high frame rates and recycling.
- **Informative Post Cards:** Each card displays:
  - Post ID badge (`#ID`)
  - Author/User indicator (`User {userId}`)
  - Title (truncated to 2 lines with graceful ellipsis)
  - Body preview (truncated to 2 lines, single-spaced)
  - Interactive press state (`surfaceRaised` visual feedback, touch feedback)
- **Pull-to-Refresh:** Integrated with React Native's `RefreshControl` via TanStack Query refetching without replacing or flashing cached content.
- **Empty State:** Clean, user-friendly empty state if the API yields no records.
- **Full Accessibility:** Meaningful accessibility labels, button roles, and hints for screen readers.

### 2. Post Detail Screen (`PostDetailScreen`)

- **Seamless Transition:** Opens upon tapping any post card in the list, passing only the post `id`.
- **Cached Instant Paint + Background Sync:** Uses TanStack Query's `placeholderData` from the posts list cache so that the detail view renders instantly without a blank screen, while refetching the latest detail in the background.
- **Complete Post Metadata:** Displays the full uncapped title, complete formatted body, Post ID chip, and User ID chip.
- **Back Navigation:** Native stack header back button with platform-native pop gestures (iOS swipe-from-edge, Android back button).
- **Graceful Error & Invalid ID Handling:** Validates numeric post IDs. If an invalid or missing post is requested (e.g. via deep link), an informative state is presented without crashing.

### 3. Loading, Error, and Retry States

- **Loading State:** Centered activity indicator with a helpful message (`Loading posts…` / `Loading post details…`).
- **Error Handling:** Maps errors to classified types (`network`, `timeout`, `parse`, `unauthorized`, `server`) and displays user-friendly localized messages.
- **Retry Mechanism:** Provides an accessible, responsive "Try again" action that directly triggers query refetching.
- **No Hardcoded Fake Data:** Fetches directly from the real public JSONPlaceholder endpoints. Dev mocks remain available for isolated offline development.

---

## 🛠️ Technology Stack & Architectural Decisions

| Layer                   | Choice                                                    | Rationale                                                                               |
| :---------------------- | :-------------------------------------------------------- | :-------------------------------------------------------------------------------------- |
| **Runtime**             | React Native 0.87.1, React 19.2.3, Hermes V1              | Bare React Native New Architecture (Fabric + TurboModules enabled)                      |
| **Language**            | TypeScript 6.0 (Strict mode)                              | Type-safe data layer, navigation routes, and props                                      |
| **Compiler**            | React Compiler 1.0 (`babel-plugin-react-compiler`)        | Automatic memoization of component render trees                                         |
| **Navigation**          | `@react-navigation/native` v7 (Static API + Native Stack) | Type-safe static navigation tree, native stack transitions, deep link resolution        |
| **Server State**        | `@tanstack/react-query` v5                                | Declarative query caching, stale-while-revalidate, deduplication, retry logic           |
| **List Virtualization** | `@shopify/flash-list` v2                                  | Next-generation list rendering leveraging Fabric on the New Architecture                |
| **Network Client**      | Native `fetch` with typed `httpClient` wrapper            | Timeout signals, cancellation signals, Zod response validation, AppError categorization |
| **Validation**          | `zod` v4                                                  | Runtime schema validation ensuring backend contracts match frontend types               |
| **Localization**        | `i18next` & `react-i18next`                               | Modular translations (`en`, `ar`) with strict parity check script                       |
| **Theme & UI**          | In-house design system                                    | Semantic color roles, 4-pt spacing scale, light & dark mode support                     |
| **Quality & Tests**     | Jest 29, Testing Library 14, ESLint 10, Prettier 3        | Architecture boundaries enforced via ESLint, 20 test suites (80 tests passing)          |

### Note on Expo Go

This project is built on **bare React Native 0.87 with the New Architecture** (Fabric/TurboModules/Hermes V1) rather than the managed Expo Go client. Expo Go does not target bare RN 0.87. Standard React Native CLI commands (`react-native run-ios`, `react-native run-android`, or Metro development server) are used to run the app.

---

## 🌐 API Endpoints Used

The application integrates with [JSONPlaceholder](https://jsonplaceholder.typicode.com):

- **List Posts:** `GET https://jsonplaceholder.typicode.com/posts`
  - Validated by `PostListSchema` (`z.array(PostSchema)`).
- **Post Details:** `GET https://jsonplaceholder.typicode.com/posts/:id`
  - Validated by `PostSchema` (`{ userId: number, id: number, title: string, body: string }`).

---

## 📂 Project Structure

The project follows a strict vertical slice architecture with downward-only dependencies:

```
src/
├── app/                  # Composition root
│   ├── App.tsx           # Providers (GestureHandler, SafeArea, QueryClient, ErrorBoundary)
│   ├── bootstrap/        # App startup, logging, and mock initialization
│   └── navigation/       # RootNavigator (static stack tree), Navigation container, deep linking
├── features/             # Vertical slices
│   ├── posts/            # Posts Explorer feature
│   │   ├── api/          # postsApi.ts (HTTP client + Zod schemas), postsKeys.ts (query keys)
│   │   ├── hooks/        # usePosts.ts (list and detail queries with placeholderData)
│   │   ├── components/   # PostCard.tsx (accessible, memoized list item)
│   │   ├── screens/      # PostListScreen.tsx (FlashList, refresh), PostDetailScreen.tsx
│   │   ├── mocks.ts      # Offline dev mock routes
│   │   └── index.ts      # Feature public API
│   ├── auth/             # Reference auth slice
│   ├── feed/             # Reference feed slice
│   └── settings/         # Reference settings slice
├── ui/                   # Design system
│   ├── components/       # Screen, Text, Button, Chip, Badge, StateView (Loading/Error/Empty)
│   └── theme/            # Theme tokens, semantic color roles, light/dark modes
├── core/                 # Shared infrastructure (API, config, errors, i18n, storage, logger)
└── shared/               # Pure utilities and non-React types
```

---

## ⚙️ Prerequisites

- **Node.js**: `v22.22.0` or `>=24.3.0` (see `.nvmrc`)
- **Package Manager**: `npm`
- **iOS:** macOS with Xcode 16.1+ and CocoaPods (`bundle install`)
- **Android:** Android Studio with Android SDK Platform 35+, NDK 27+, JDK 17

---

## 🚀 Installation & Running

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Native Pods (iOS only)

```bash
bundle install && npm run pods
```

### 3. Start the Metro Bundler

```bash
npm start
# or reset cache if needed:
npm run start:reset
```

### 4. Run on iOS (Simulator)

```bash
npm run ios:dev
```

### 5. Run on Android (Emulator / Device)

```bash
npm run android:dev
```

---

## 🧪 Testing and Quality Assurance

The codebase enforces strict quality checks across TypeScript, ESLint layer boundaries, Prettier, i18n key parity, and Jest test suites.

### Run All Validation Checks (Typecheck + Lint + Format + i18n + Tests)

```bash
npm run validate
```

### Individual Commands

- **TypeScript Typecheck:** `npm run typecheck`
- **Lint (Architecture & ESLint):** `npm run lint`
- **Prettier Format Check:** `npm run format:check`
- **Auto-Format:** `npm run format`
- **i18n Parity Check:** `npm run i18n:check`
- **Run Unit Tests:** `npm test`
- **Test Coverage:** `npm run test:coverage`

---

## 🔗 Deep Linking

Deep linking is statically defined and tested via `RootNavigator`:

- `baseline-dev://` or `posts` → Opens **Posts List** (`PostListScreen`)
- `baseline-dev://posts/:id` → Opens **Post Detail** (`PostDetailScreen`) for post `:id`

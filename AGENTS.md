# AGENTS.md — SnapVocab Intern Onboarding Guide

## Overview

SnapVocab is a React Native mobile app (Expo SDK 54) that helps users learn English vocabulary by scanning real-world objects with their camera. AI identifies objects and generates vocabulary flashcards in the user's native language.

The project currently has **2 implemented features**: a Welcome screen and an Auth flow (Login, Register, Email Verification).

---

## Getting Started

### Prerequisites

- **Node.js** (LTS)
- **pnpm** (`npm i -g pnpm`)
- **Expo Go** app on your phone, or an Android/iOS simulator
- **VS Code** or Cursor editor

```bash
git clone <repo-url>
cd SnapVocab
pnpm install
pnpm start
```

---

## Project Structure

```
SnapVocab/
├── src/
│   ├── app/                    # Routes (file-based routing)
│   │   ├── _layout.tsx         # Root layout: global providers + splash screen
│   │   ├── (app)/              # Authenticated routes group
│   │   │   ├── _layout.tsx     # Auth gate + Tabs navigator
│   │   │   └── index.tsx       # Home screen (post-login)
│   │   ├── welcome.tsx         # Welcome screen
│   │   ├── login.tsx           # Login screen
│   │   ├── register.tsx        # Register screen
│   │   └── verify.tsx          # Email verification screen
│   ├── features/               # Feature modules (code grouped by feature)
│   │   ├── auth/               # Auth feature
│   │   │   ├── api.ts          # React Query mutations
│   │   │   ├── use-auth-store.ts  # Zustand store (user, tokens, status)
│   │   │   ├── login-screen.tsx
│   │   │   ├── register-screen.tsx
│   │   │   ├── verify-screen.tsx
│   │   │   └── components/
│   │   │       ├── login-form.tsx      # TanStack Form + Zod
│   │   │       └── register-form.tsx   # TanStack Form + Zod
│   │   ├── welcome/
│   │   │   └── welcome-screen.tsx
│   │   └── home/
│   │       └── home-screen.tsx     # Post-login landing page
│   ├── components/ui/          # Reusable UI primitives
│   │   ├── button.tsx          # Button (variant, size, loading, disabled)
│   │   ├── input.tsx           # TextInput (label, error, focused states)
│   │   ├── text.tsx            # Text with i18n support (tx prop)
│   │   ├── image.tsx           # Image wrapper (expo-image)
│   │   ├── focus-aware-status-bar.tsx
│   │   ├── form-utils.ts       # TanStack Form error extraction helper
│   │   ├── utils.tsx           # showError, showErrorMessage helpers
│   │   ├── colors.js           # Color palette constants
│   │   ├── index.tsx           # Barrel exports + SafeAreaView, View, etc.
│   │   └── use-theme-config.tsx
│   ├── lib/                    # Shared utilities (pre-configured)
│   │   ├── api/
│   │   │   ├── client.tsx      # Axios instance with auth interceptor + token refresh
│   │   │   ├── provider.tsx    # React Query provider
│   │   │   └── utils.tsx       # Pagination helpers, getQueryKey, normalizePages
│   │   ├── auth/
│   │   │   └── utils.tsx       # Token get/set/remove
│   │   ├── hooks/
│   │   │   ├── use-selected-theme.tsx  # Theme (light/dark/system)
│   │   │   └── index.tsx
│   │   ├── i18n/
│   │   │   ├── index.tsx       # i18next initialization
│   │   │   ├── utils.tsx       # translate(), useSelectedLanguage()
│   │   │   ├── resources.ts    # Language resource mappings
│   │   │   └── types.ts        # Recursive key types for type-safe i18n
│   │   ├── storage.tsx         # MMKV wrapper (getItem, setItem, removeItem)
│   │   └── utils.ts            # createSelectors for Zustand
│   ├── translations/
│   │   ├── en.json             # English strings
│   │   └── vi.json             # Vietnamese strings
│   └── global.css              # TailwindCSS theme definitions
├── app.config.ts               # Expo configuration
├── env.ts                      # Environment variable schema + validation
├── .env                        # Environment variables (API_URL, etc.)
├── package.json
├── tsconfig.json
└── jest.config.js
```

---

## Library Usage Guide

### 1. Expo Router — File-Based Routing

Every file in `src/app/` becomes a route automatically. Files named `_layout.tsx` wrap nested routes.

```
src/app/_layout.tsx          → root layout (providers, splash, registers all screens)
src/app/(app)/_layout.tsx    → auth gate + tabs for authenticated users
src/app/(app)/index.tsx      → / (home screen, shows after login)
src/app/welcome.tsx          → /welcome
src/app/login.tsx            → /login
src/app/register.tsx         → /register
src/app/verify.tsx           → /verify
```

Route files are thin re-exports pointing to feature screens:

```tsx
// src/app/login.tsx — NO logic here, just a re-export
export { LoginScreen as default } from '@/features/auth/login-screen';
```

**Route groups** like `(app)` use `()` — the group name doesn't appear in the URL. The `(app)/_layout.tsx` applies to all routes inside `(app)/`.

**Navigation** uses the `useRouter` hook:

```tsx
import { useRouter } from 'expo-router';
const router = useRouter();
router.replace('/');          // redirect after login
router.push('/flashcards');   // push new screen
router.back();                // go back
```

---

### 2. React Hook Form + Zod — Form State & Validation

Always use React Hook Form with Zod validation (`@hookform/resolvers/zod`).

**Pattern:**
```tsx
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, Input } from '@/components/ui';
import { translate } from '@/lib/i18n/utils';

// 1. Define validation schema with Zod
const schema = z.object({
  email: z.string().email(translate('validation.email_invalid')),
  password: z.string().min(6, translate('validation.password_min')),
});

type FormValues = z.infer<typeof schema>;

// 2. Initialize form
const {
  control,
  handleSubmit,
  formState: { errors, isSubmitting },
} = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: { email: '', password: '' },
});

// 3. Render fields with Controller
<Controller
  control={control}
  name="email"
  render={({ field: { onChange, onBlur, value } }) => (
    <Input
      label={translate('login.email')}
      value={value}
      onChangeText={onChange}
      onBlur={onBlur}
      error={errors.email?.message}
    />
  )}
/>

// 4. Password field (uses built-in isPassword toggle - no manual state needed!)
<Controller
  control={control}
  name="password"
  render={({ field: { onChange, onBlur, value } }) => (
    <Input
      isPassword
      placeholder="Enter password"
      value={value}
      onChangeText={onChange}
      onBlur={onBlur}
      error={errors.password?.message}
    />
  )}
/>

// 5. Submit button
<Button
  label="Sign In"
  loading={isSubmitting || isPending}
  onPress={handleSubmit(onSubmit)}
/>
```

**OTP Verification Pattern:**
```tsx
import { OtpInput } from '@/components/ui';

// 6 chunky 3D boxes with auto-focus, paste, and backspace
<OtpInput
  value={code}
  onChange={setCode}
/>
```

---

### 3. React Query (TanStack Query) — Server Data & API Calls

All API calls go through standard TanStack Query wrapped in clean Custom Hooks (`useMutation`, `useQuery`).

**Mutations** (POST, PUT, PATCH, DELETE):

```tsx
// src/features/flashcards/api.ts
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { client } from '@/lib/api';

type CreateFlashcardRequest = { word: string; translation: string };
type CreateFlashcardResponse = { id: number; word: string };

export function useCreateFlashcard() {
  return useMutation<CreateFlashcardResponse, AxiosError, CreateFlashcardRequest>({
    mutationFn: async (variables) => {
      const { data } = await client.post('/api/flashcards', variables);
      return data;
    },
  });
}

// Using in a component:
const { mutate, isPending } = useCreateFlashcard();
mutate({ word: 'apple', translation: 'quả táo' }, {
  onSuccess: (data) => { /* navigate or show success */ },
  onError: () => { showErrorMessage('Failed to create flashcard'); },
});
```

**Queries** (GET requests):

```tsx
import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { client } from '@/lib/api';

type GetFlashcardsParams = { page?: number; limit?: number };
type Flashcard = { id: number; word: string; translation: string };

export function useFlashcards(params?: GetFlashcardsParams) {
  return useQuery<Flashcard[], AxiosError>({
    queryKey: ['flashcards', params],
    queryFn: async () => {
      const { data } = await client.get('/api/flashcards', { params });
      return data;
    },
  });
}

// In component:
const { data, isLoading, isError, refetch } = useFlashcards({ page: 1 });
```

**Pattern: lifting React Query into custom hooks**

When a query needs derived state or combines with Zustand, wrap it in a custom hook:

```tsx
// A custom hook that combines query data with local state
export function useFlashcardList() {
  const { data, isLoading, refetch } = useFlashcards({ page: 1 });
  const search = useFlashcardStore(s => s.filters.search);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter(f => f.word.includes(search || ''));
  }, [data, search]);

  return { flashcards: filtered, isLoading, refetch };
}
```

**Axios client** (`src/lib/api/client.tsx`) has pre-configured interceptors:
- **Request interceptor**: auto-attaches `Bearer <accessToken>` from Zustand store
- **Response interceptor**: on 401, auto-refreshes the token via `/api/auth/refresh` and retries the request. If refresh fails, logs the user out.

You never need to set `Authorization` headers manually — just use `client` from `@/lib/api`.

---

### 4. Zustand — Client-Side Global State

Zustand stores live next to their feature (e.g., `src/features/auth/use-auth-store.ts`). Use standard Zustand selectors for optimal rendering and simplicity.

**Pattern: persisted store**
```tsx
// src/features/flashcards/use-flashcard-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage } from '@/lib/storage';

type State = {
  filters: Record<string, string>;
  setFilters: (filters: Record<string, string>) => void;
};

export const useFlashcardStore = create<State>()(
  persist(
    (set) => ({
      filters: {},
      setFilters: (filters) => set({ filters }),
    }),
    {
      name: 'flashcard-storage',      // MMKV key
      storage: createJSONStorage(() => ({
        getItem: (name) => storage.getString(name) ?? null,
        setItem: (name, value) => storage.set(name, value),
        removeItem: (name) => storage.remove(name),
      })),
    }
  )
);
```

**Using in components:**
```tsx
// Standard Zustand selectors (clean, simple, standard)
const filters = useFlashcardStore(s => s.filters);
const setFilters = useFlashcardStore(s => s.setFilters);

// Calling actions
setFilters({ search: 'apple' });
```

**Non-persisted store** (in-memory only, for UI state like modals):
```tsx
const store = create<State>()((set) => ({
  isOpen: false,
  toggle: () => set(s => ({ isOpen: !s.isOpen })),
}));
export const useModalStore = createSelectors(store);
```

**Hydration pattern** (for auth-like stores that need to decide signIn/signOut on app start):
```tsx
// Called at module level in _layout.tsx before any render
export const hydrateAuth = () => store.getState().hydrate();
// hydrate() checks persisted tokens and sets status to 'signIn' or 'signOut'
```

---

### 5. TailwindCSS via Uniwind — Styling

Use Tailwind class strings. **Never use inline styles.** Dark mode uses the `dark:` prefix.

```tsx
// Good
<View className="flex-1 items-center justify-center bg-white dark:bg-neutral-900" />
<Text className="text-2xl font-bold text-neutral-900 dark:text-white" />

// Bad
<View style={{ flex: 1, alignItems: 'center' }} />
```

Colors are defined in `src/global.css` as CSS custom properties (`--color-primary-500`, etc.) and are available as Tailwind classes (`bg-primary-500`, `text-primary-500`).

**Custom Text component** (`@/components/ui`) supports a `tx` prop for i18n:

```tsx
<Text tx="login.title" className="text-3xl font-bold" />
// equivalent to: <Text>{translate('login.title')}</Text>
```

---

### 6. i18n — Internationalization

**Adding new strings:**
1. Add keys to `src/translations/en.json` and `src/translations/vi.json` (both must have identical structure)
2. Use in code:

```tsx
import { translate } from '@/lib/i18n/utils';

// Static text
<Text>{translate('flashcards.title')}</Text>

// With interpolation
<Text>{translate('verify.subtitle', { email: 'user@example.com' })}</Text>
// en.json: "subtitle": "Code sent to {{email}}"

// Using the tx prop on custom Text
<Text tx="flashcards.empty" />
```

**i18n config** is initialized in `src/lib/i18n/index.tsx`. Language is stored in MMKV and loaded at startup.

---

### 7. Adding a New Feature — Step-by-Step

Example: adding a "Flashcards" feature.

**Step 1: Create the feature directory**
```
src/features/flashcards/
├── api.ts                    # React Query hooks
├── use-flashcard-store.ts    # Zustand store (if needed)
├── flashcards-screen.tsx     # Screen component
└── components/               # Feature-specific components
```

**Step 2: Create the screen component**
```tsx
// src/features/flashcards/flashcards-screen.tsx
import { FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';

export function FlashcardsScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <View className="flex-1 items-center justify-center">
        <Text tx="flashcards.title" className="text-2xl font-bold" />
      </View>
    </SafeAreaView>
  );
}
```

**Step 3: Create the route file**
```tsx
// src/app/(app)/flashcards.tsx
export { FlashcardsScreen as default } from '@/features/flashcards/flashcards-screen';
```

**Step 4: Register in the tabs layout**
```tsx
// src/app/(app)/_layout.tsx — add a new Tab.Screen
import { Flashcards as FlashcardsIcon } from '@/components/ui/icons';

<Tabs.Screen
  name="flashcards"
  options={{
    title: 'Flashcards',
    tabBarIcon: ({ color }) => <FlashcardsIcon color={color} />,
  }}
/>
```

**Step 5: Add API hooks (if fetching data)**
```tsx
// src/features/flashcards/api.ts
import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { client } from '@/lib/api';

export function useFlashcards() {
  return useQuery<Flashcard[], AxiosError>({
    queryKey: ['flashcards'],
    queryFn: async () => {
      const { data } = await client.get('/api/flashcards');
      return data;
    },
  });
}
```

**Step 6: Add translation keys**
```json
// en.json
{ "flashcards": { "title": "My Flashcards", "empty": "No flashcards yet" } }
// vi.json
{ "flashcards": { "title": "Thẻ từ vựng", "empty": "Chưa có thẻ nào" } }
```

---

## Commands Quick Reference

```bash
pnpm start              # Start Expo dev server
pnpm android            # Run on Android
pnpm ios                # Run on iOS
pnpm lint               # Run ESLint
pnpm lint:fix           # Run ESLint with auto-fix
pnpm type-check         # TypeScript validation
pnpm test               # Run Jest tests
pnpm check-all          # Run all quality checks (lint + type-check + translations + test)
```

---

## Rules & Conventions

| Rule | Good | Bad |
|------|------|-----|
| **Imports** | `@/components/ui/button` | `../../components/ui/button` |
| **Forms** | React Hook Form + Zod | `useState` for complex form fields |
| **API calls** | React Query mutations/queries | Raw `axios.get()` in components |
| **Global state** | Zustand with MMKV persistence | React Context for shared state |
| **Styling** | Tailwind class strings | `style={{...}}` inline |
| **Text** | `translate('key.path')` or `tx="key.path"` | Hardcoded strings |
| **New code** | `src/features/<name>/` | Scattered across `components/` |
| **Routes** | Files in `src/app/` re-exporting feature screens | Screen logic in route files |
| **Env vars** | `EXPO_PUBLIC_*` prefix in `.env` | Hardcoded URLs |

---

## Current Features

### Welcome Screen (`/welcome`)
- Onboarding illustration with app tagline
- Two CTAs: Sign In and Create Account
- File: `src/features/welcome/welcome-screen.tsx`

### Auth Flow (`/login`, `/register`, `/verify`)
- **Login**: Email + password form with Zod validation
- **Register**: First name, last name, email, password form
- **Verify**: 6-digit code input with resend support
- API endpoints: `/api/auth/login`, `/api/auth/register`, `/api/auth/verify`
- Zustand store persists user + tokens to MMKV
- Axios interceptor auto-attaches Bearer token + handles 401 refresh
- Files: `src/features/auth/`

### Home (`/`)
- Post-login landing with "Welcome to SnapVocab" text
- Tabs navigator with single Home tab (ready for more tabs)
- Auth gate in `(app)/_layout.tsx` redirects to /welcome if signed out

---

## Next Features to Build

1. **Camera Scanner** — Capture real-world objects using the device camera
2. **AI Object Detection** — Send images to AI API for object identification
3. **Vocabulary Flashcards** — Display vocabulary cards with translations
4. **Vocabulary Collection** — Save, review, and manage learned words
5. **Progress Tracking** — Streaks, XP, coins (data model already defined in auth store)

---

## Environment Variables

Edit `.env` file:

```
EXPO_PUBLIC_API_URL=https://your-api-url.com
EXPO_PUBLIC_APP_ENV=development
```

Access in code via `env.ts`:
```tsx
import Env from 'env';
console.log(Env.EXPO_PUBLIC_API_URL);
```

# Convert SVG to react native svg
Simple conversion rules:

  On <Svg> tag:
  - Keep only viewBox="...", fill="none"
  - Add width={24} height={24} (numbers)
  - Remove xmlns, class, stroke, stroke-width

  On <Path> tag:
  - Keep d="..." as-is
  - Kebab-case → camelCase: stroke-width → strokeWidth, stroke-linecap → strokeLinecap, stroke-linejoin → strokeLinejoin
  - String values → numbers: stroke-width="1.5" → strokeWidth={2}
  - stroke="currentColor" → stroke={color}
  - Remove class, fill (put fill="none" on <Svg> instead)

  Template:

  import Svg, { Path } from 'react-native-svg';

  type Props = { color?: string };

  export function IconName({ color = '#000' }: Props) {
    return (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
          d="<paste path data here>"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
# SnapVocab

**Problem:** Learn English vocabulary by scanning real-world objects with your camera.
**Solution:** SnapVocab uses AI-powered object detection to identify items and instantly generate vocabulary flashcards in your native language.

## Currently Implemented

- **Welcome Screen** (`src/features/welcome/`) — Onboarding landing page with app introduction, sign-in and sign-up CTAs.
- **Auth Flow** (`src/features/auth/`) — Login, Register, Email Verification screens using TanStack Form + Zod, backed by REST API calls via React Query mutations.

## Technology Stack

| Category | Library |
|----------|---------|
| Framework | Expo SDK 54 + React Native 0.81 |
| Routing | Expo Router 6 (file-based) |
| Styling | TailwindCSS via Uniwind |
| Forms | TanStack Form + Zod |
| Data Fetching | React Query (TanStack Query) + axios |
| State | Zustand (with MMKV persistence) |
| Storage | react-native-mmkv |
| i18n | i18next + react-i18next |
| Testing | Jest + React Testing Library |

## Project Structure

```
src/
├── app/              # Expo Router file-based routes
│   ├── _layout.tsx   # Root layout (providers, stack screens)
│   ├── (app)/        # Authenticated app group
│   │   ├── _layout.tsx  # Auth gate (redirect to welcome if not signed in)
│   │   └── index.tsx    # Post-login home screen
│   ├── welcome.tsx   # Welcome screen route
│   ├── login.tsx     # Login screen route
│   ├── register.tsx  # Register screen route
│   └── verify.tsx    # Email verification route
├── features/         # Feature modules
│   ├── auth/         # Auth screens, forms, API, store
│   ├── welcome/      # Welcome/onboarding screen
│   └── home/         # Post-login home screen
├── components/ui/    # Reusable UI primitives (Button, Input, Text, Image, etc.)
├── lib/              # Shared utilities
│   ├── api/          # Axios client, React Query provider
│   ├── auth/         # Token management helpers
│   ├── hooks/        # Shared hooks (first-time, theme)
│   ├── i18n/         # i18next setup, translate helper
│   └── storage.tsx   # MMKV storage wrapper
└── translations/     # i18n JSON files (en.json, vi.json)
```

## Commands

```bash
pnpm start          # Start dev server
pnpm android/ios    # Run on device/simulator
pnpm lint           # ESLint
pnpm type-check     # TypeScript validation
pnpm test           # Jest tests
pnpm check-all      # All quality checks
```

## Key Patterns

- **Imports:** Always use `@/` prefix (e.g., `@/components/ui/button`), never relative imports.
- **Forms:** Use TanStack Form + Zod (see `src/features/auth/components/login-form.tsx`).
- **API calls:** Use React Query mutations via `react-query-kit` (see `src/features/auth/api.ts`).
- **State:** Use Zustand with MMKV persistence (see `src/features/auth/use-auth-store.ts`).
- **Styling:** Use Tailwind class strings (NativeWind/Uniwind). Do not use inline styles.
- **i18n:** Use `translate('key.path')` from `@/lib/i18n/utils`. Add keys to `src/translations/`.

## Environment Variables

Prefix with `EXPO_PUBLIC_*` to access in app code. See `env.ts` for schema definition and `.env` for values.

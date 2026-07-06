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
- **Icons:** Use `createIcon` factory from `@/components/ui/icons/create-icon`. Create file in `src/components/ui/icons/`, export from `index.tsx`. See below for patterns.

## Icon Factory

Create new icons using `createIcon` factory in `src/components/ui/icons/`.

### Fill icon (colored shape):
```tsx
// src/components/ui/icons/star.tsx
import { createIcon } from './create-icon';

export const StarIcon = createIcon({
  viewBox: '0 0 24 24',
  elements: [
    { d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z', fill: '#FBBF24' },
  ],
});
```

### Stroke icon (outlined, e.g. HeroIcons):
```tsx
// src/components/ui/icons/chevron.tsx
import { createIcon } from './create-icon';

export const ChevronIcon = createIcon({
  viewBox: '0 0 24 24',
  elements: [
    { d: 'M15 19l-7-7 7-7', stroke: '#000', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
  ],
});
```

### Multiple elements (path + circle):
```tsx
export const BellIcon = createIcon({
  viewBox: '0 0 24 24',
  elements: [
    { d: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9', stroke: '#000', strokeWidth: 2 },
    { cx: 12, cy: 22, r: 2, stroke: '#000', strokeWidth: 2 },
  ],
});
```

### Usage:
```tsx
import { StarIcon, ChevronIcon } from '@/components/ui/icons';

// Fill icon — default color from element config
<StarIcon />

// Override color via fill prop (works for both fill and stroke icons)
<ChevronIcon fill="#3B82F6" />

// Stroke icon — color prop also works (backward compat)
<ChevronIcon color="#3B82F6" />
```

### Rules:
- One file per icon in `src/components/ui/icons/`
- Add `export * from './icon-name'` to `src/components/ui/icons/index.tsx`
- Use `fill` for colored shapes, `stroke` for outlines
- If icon needs custom logic (conditional elements, size prop), keep as standalone component

## Environment Variables

Prefix with `EXPO_PUBLIC_*` to access in app code. See `env.ts` for schema definition and `.env` for values.

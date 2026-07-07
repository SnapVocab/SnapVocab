# SnapVocab

Learn English vocabulary by scanning real-world objects with your camera. AI identifies objects and generates vocabulary flashcards in your native language.

## Tech Stack

Expo SDK 54 + React Native 0.81 | Expo Router 6 | TanStack Form + Zod | React Query | Zustand + MMKV | TailwindCSS via Uniwind | i18next

## Quick Start

```bash
pnpm install
pnpm start
```

Press `a` for Android or `i` for iOS in the Expo dev menu.

## Environment Variables

Three environment files for different stages:

| File | Purpose | Loaded by |
|------|---------|-----------|
| `.env.development` | Local development | `pnpm start` |
| `.env.preview` | Staging/preview | `pnpm start:preview` |
| `.env.production` | Production | EAS builds |

To add a new variable:

1. Add to all three `.env.*` files
2. Add schema in `env.ts`
3. Use `import Env from '@/env'` in code

See `.env.example` for all available variables.

## Documentation

See [AGENTS.md](./AGENTS.md) for the complete intern onboarding guide covering project structure, key patterns, conventions, and how to add new features.

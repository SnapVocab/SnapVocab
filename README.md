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

| File               | Purpose           | Loaded by            |
| ------------------ | ----------------- | -------------------- |
| `.env.development` | Local development | `pnpm start`         |
| `.env.preview`     | Staging/preview   | `pnpm start:preview` |
| `.env.production`  | Production        | EAS builds           |

To add a new variable:

1. Add to all three `.env.*` files
2. Add schema in `env.ts`
3. Use `import Env from '@/env'` in code

See `.env.example` for all available variables.

## Local Android development APK

To switch back from a production build, run `pnpm build:apk:dev`. It loads
`.env.development`, prebuilds the development package, refreshes generated
autolinking and builds `android/app/build/outputs/apk/debug/app-debug.apk`.
Install that APK on your device, then run `pnpm start` and open **SnapVocab Dev**.
The production APK cannot load JavaScript from Metro. On the Android emulator,
the development API URL `http://10.0.2.2:8080` points to the backend on your PC.
On a physical device, use your PC's LAN address or `adb reverse tcp:8080 tcp:8080`
with `http://127.0.0.1:8080` in `.env.development` and restart Metro.

## Local production APK

With dependencies, JDK 17, and Android SDK installed, fill in `.env.production`
and run:

```bash
pnpm build:apk:prod
```

The command loads `.env.production`, prebuilds Android, refreshes generated
autolinking to use the production package, and builds a standalone release APK:
`android/app/build/outputs/apk/release/app-release.apk`.

The current native configuration signs this APK with the debug key for internal
installation. `build:production:android` remains the separate EAS cloud command.

## Documentation

See [AGENTS.md](./AGENTS.md) for the complete intern onboarding guide covering project structure, key patterns, conventions, and how to add new features.

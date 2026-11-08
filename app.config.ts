import type { ConfigContext, ExpoConfig } from '@expo/config';

import type { AppIconBadgeConfig } from 'app-icon-badge/types';
import { existsSync } from 'node:fs';

import 'tsx/cjs';

// adding lint exception as we need to import tsx/cjs before env.ts is imported
// eslint-disable-next-line perfectionist/sort-imports
import Env from './env';

const EXPO_ACCOUNT_OWNER = 'thanhthbms-team';
const EAS_PROJECT_ID = '9197f5cf-9075-4cd3-badb-840838f21df2';

const appIconBadgeConfig: AppIconBadgeConfig = {
  enabled: Env.EXPO_PUBLIC_APP_ENV !== 'production',
  badges: [
    {
      text: Env.EXPO_PUBLIC_APP_ENV,
      type: 'banner',
      color: 'white',
    },
    {
      text: Env.EXPO_PUBLIC_VERSION.toString(),
      type: 'ribbon',
      color: 'white',
    },
  ],
};

const fontPluginConfig = {
  ios: {
    fonts: [
      'node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf',
      'node_modules/@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf',
      'node_modules/@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf',
      'node_modules/@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf',
    ],
  },
  android: {
    fonts: [
      {
        fontFamily: 'Inter',
        fontDefinitions: [
          {
            path: 'node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf',
            weight: 400,
          },
          {
            path: 'node_modules/@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf',
            weight: 500,
          },
          {
            path: 'node_modules/@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf',
            weight: 600,
          },
          {
            path: 'node_modules/@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf',
            weight: 700,
          },
        ],
      },
    ],
  },
};

const CAMERA_PERMISSION = 'Allow $(PRODUCT_NAME) to use the camera to scan objects.';

const plugins: ExpoConfig['plugins'] = [
  './plugins/with-windows-cmake-path',
  [
    'expo-splash-screen',
    {
      backgroundColor: '#2416ED',
      image: './assets/splash-icon.png',
      imageWidth: 150,
    },
  ],
  ['expo-font', fontPluginConfig],
  'expo-localization',
  'expo-router',
  ['app-icon-badge', appIconBadgeConfig],
  ['react-native-edge-to-edge'],
  [
    'expo-image-picker',
    {
      cameraPermission: CAMERA_PERMISSION,
      photosPermission: 'Allow $(PRODUCT_NAME) to access your photos to scan objects.',
    },
  ],
  ['expo-camera', { cameraPermission: CAMERA_PERMISSION, recordAudioAndroid: false }],
  // Review reminders (notification.md §3.9); FCM v1 and APNs keys live on EAS, not in the repo.
  'expo-notifications',
];

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: Env.EXPO_PUBLIC_NAME,
  description: `${Env.EXPO_PUBLIC_NAME} Mobile App`,
  owner: EXPO_ACCOUNT_OWNER,
  scheme: Env.EXPO_PUBLIC_SCHEME,
  slug: 'snapvocab',
  version: Env.EXPO_PUBLIC_VERSION.toString(),
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: Env.EXPO_PUBLIC_BUNDLE_ID,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  experiments: {
    typedRoutes: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundImage: './assets/adaptive-background.png',
      monochromeImage: './assets/adaptive-monochrome.png',
      backgroundColor: '#2416ED',
    },
    package: Env.EXPO_PUBLIC_PACKAGE,
    // Firebase config for FCM push (notification.md §1.4 DEP-NOTIF-02): an EAS file env var on builds,
    // or a local ./google-services.json (not committed). Without it the app builds, but gets no push token on Android.
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON
      ?? (existsSync('./google-services.json') ? './google-services.json' : undefined),
    softwareKeyboardLayoutMode: 'resize',
    // expo-image-picker's requestCameraPermissionsAsync() checks this at runtime;
    // without it declared, the permission request silently always resolves denied.
    permissions: ['android.permission.CAMERA'],
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins,
  extra: {
    eas: {
      projectId: EAS_PROJECT_ID,
    },
  },
});

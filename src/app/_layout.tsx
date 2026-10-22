import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { LogBox, StyleSheet } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeConfig } from '@/components/ui/use-theme-config';

import { PushHost } from '@/features/notifications/push-host';
import { ShopThemeProvider } from '@/features/shop';
import { APIProvider } from '@/lib/api';
import { loadSelectedTheme } from '@/lib/hooks/use-selected-theme';
import '../global.css';

LogBox.ignoreLogs(['Unable to activate keep awake']);

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(app)',
};

loadSelectedTheme();

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
  duration: 500,
  fade: true,
});

export default function RootLayout() {
  // const status = useAuthStore(s => s.status);

  React.useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <Providers>
      <PushHost />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="welcome" />
      </Stack>
    </Providers>
  );
}

function Providers({ children }: { children: React.ReactNode }) {
  const theme = useThemeConfig();
  const insets = useSafeAreaInsets();
  return (
    <GestureHandlerRootView
      style={styles.container}
      // eslint-disable-next-line better-tailwindcss/no-unknown-classes
      className={theme.dark ? 'dark' : undefined}
    >
      <KeyboardProvider>
        <ShopThemeProvider>
          <NavigationTheme>
            <APIProvider>
              <BottomSheetModalProvider>
                {children}
                <FlashMessage position="top" statusBarHeight={insets.top} />
              </BottomSheetModalProvider>
            </APIProvider>
          </NavigationTheme>
        </ShopThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

/** Navigator surfaces follow the user's light/dark mode only; Shop themes are scoped to themed screens (ShopSurface). */
function NavigationTheme({ children }: { children: React.ReactNode }) {
  return <ThemeProvider value={useThemeConfig()}>{children}</ThemeProvider>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

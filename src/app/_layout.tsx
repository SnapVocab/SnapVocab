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

import { ShopThemeProvider, useShopTheme } from '@/features/shop';
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

/** Equipped Shop theme recolors every navigator surface (screen background, headers, cards), not just Shop screens. */
function NavigationTheme({ children }: { children: React.ReactNode }) {
  const base = useThemeConfig();
  const { themeKey, theme } = useShopTheme();
  const value = React.useMemo(() => {
    if (themeKey === 'DEFAULT')
      return base;
    const t = theme.surfaceTokens;
    return { ...base, colors: { ...base.colors, background: t.background, card: t.surface, text: t.text, border: t.border } };
  }, [base, themeKey, theme]);
  return <ThemeProvider value={value}>{children}</ThemeProvider>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

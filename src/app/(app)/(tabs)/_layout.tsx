import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { Href } from 'expo-router';
import { Tabs, useRouter } from 'expo-router';
import * as React from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResolveClassNames } from 'uniwind';

import { Text, useSurface } from '@/components/ui';
import { CameraTabButton } from '@/components/ui/camera-tab-button';
import {
  CameraIcon,
  Home as HomeIcon,
  LearnIcon,
  ProfileIcon,
  ShoppingBagIcon,
} from '@/components/ui/icons';
import { SlidingTabBar } from '@/components/ui/sliding-tab-bar';
import { useReduceMotion } from '@/features/badges/use-reduce-motion';
import { HomeHeader } from '@/features/home';
import { useMe } from '@/features/profile/api';
import { translate } from '@/lib/i18n';

/** Keeps GET /api/users/me isolated so profile updates never re-render the entire Tabs navigator. */
function MeBootstrap() {
  useMe();
  return null;
}

export default function TabLayout() {
  const router = useRouter();
  const reduceMotion = useReduceMotion();
  // Edge-to-edge: the system gesture/nav bar draws over the app, so the tab bar
  // grows by the bottom inset instead of letting it cover the labels.
  const { bottom } = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const expanded = width >= 840;
  // App-wide chrome: default surfaces for the user's light/dark mode.
  const surface = useSurface();
  const navigationSurface = useResolveClassNames(expanded
    ? 'border-r border-line bg-surface'
    : 'border-t-2 border-line bg-surface');
  const itemStyle = useResolveClassNames(expanded ? 'my-1 min-h-20 rounded-2xl' : 'min-h-14');
  // Navigator APIs require resolved styles; only safe-area and font-scale geometry is dynamic.
  const navigationStyle = React.useMemo(() => ({
    ...navigationSurface,
    ...(expanded
      ? { width: fontScale > 1.2 ? 144 : 112 }
      : {
          height: Math.ceil(48 + (fontScale > 1.6 ? 48 : 32) * fontScale) + bottom,
          paddingBottom: 8 + bottom,
          paddingTop: 8,
        }),
  }), [navigationSurface, expanded, fontScale, bottom]);

  const renderTabBar = React.useCallback(
    (props: BottomTabBarProps) => <SlidingTabBar {...props} reduceMotion={reduceMotion} />,
    [reduceMotion],
  );

  const renderHomeHeader = React.useCallback(() => (
    <HomeHeader
      onStreakPress={() => router.push('/stats')}
      onCoinPress={() => router.push('/profile/wallet')}
      onAvatarPress={() => router.push('/profile')}
      onNotificationPress={() => router.push('/notifications' as Href)}
    />
  ), [router]);

  return (
    <>
      <MeBootstrap />
      <Tabs
        tabBar={renderTabBar}
        screenOptions={{
          animation: 'none',
          freezeOnBlur: true,
          sceneStyle: { backgroundColor: surface.background },
          tabBarActiveTintColor: surface.action,
          tabBarInactiveTintColor: surface.textMuted,
          tabBarStyle: navigationStyle,
          tabBarItemStyle: itemStyle,
          tabBarPosition: expanded ? 'left' : 'bottom',
          tabBarVariant: expanded ? 'material' : 'uikit',
          tabBarLabelPosition: 'below-icon',
          tabBarLabel: ({ focused, children }) => (
            <Text className={`text-center font-nunito text-xs/4 font-bold ${focused ? 'text-action dark:text-action' : 'text-neutral-500 dark:text-neutral-300'}`}>
              {children}
            </Text>
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: translate('home.tab_label'),
            headerShown: true,
            header: renderHomeHeader,
            tabBarIcon: ({ color }) => <HomeIcon color={color} />,
            tabBarButtonTestID: 'home-tab',
          }}
        />
        <Tabs.Screen
          name="learn"
          options={{
            title: translate('learn.tab_label'),
            headerShown: false,
            tabBarIcon: ({ color }) => <LearnIcon color={color} />,
            tabBarButtonTestID: 'learn-tab',
          }}
        />
        <Tabs.Screen
          name="camera"
          options={{
            animation: 'none',
            title: expanded ? translate('home.scan_camera') : '',
            headerShown: false,
            tabBarButton: expanded ? undefined : props => <CameraTabButton {...props} />,
            tabBarIcon: ({ color }) => <CameraIcon color={color} />,
            tabBarButtonTestID: 'camera-tab',
            tabBarStyle: { display: 'none' },
            // Dark behind the system navigation bar, like the camera itself.
            sceneStyle: { backgroundColor: '#000000' },
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            title: translate('shop.title'),
            headerShown: false,
            tabBarIcon: ({ color }) => <ShoppingBagIcon color={color} />,
            tabBarButtonTestID: 'shop-tab',
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: translate('profile.tab_label'),
            headerShown: false,
            tabBarIcon: ({ color }) => <ProfileIcon color={color} />,
            tabBarButtonTestID: 'profile-tab',
          }}
        />
      </Tabs>
    </>
  );
}

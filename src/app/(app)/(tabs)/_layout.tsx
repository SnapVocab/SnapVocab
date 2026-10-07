import { Tabs, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSurface } from '@/components/ui';
import { CameraTabButton } from '@/components/ui/camera-tab-button';
import {
  CommunityIcon,
  Home as HomeIcon,
  LearnIcon,
  ProfileIcon,
} from '@/components/ui/icons';
import { HomeHeader } from '@/features/home';
import { useInventory } from '@/features/shop';

export default function TabLayout() {
  const router = useRouter();
  // Edge-to-edge: the system gesture/nav bar draws over the app, so the tab bar
  // grows by the bottom inset instead of letting it cover the labels.
  const { bottom } = useSafeAreaInsets();
  // Fetching inventory syncs the account's equipped theme into ShopThemeProvider on app start / login.
  useInventory();
  // App-wide chrome: default surfaces for the user's light/dark mode; Shop themes stay inside the Shop area.
  const surface = useSurface();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#58CC02',
        tabBarInactiveTintColor: '#AFAFAF',
        tabBarStyle: {
          backgroundColor: surface.surface,
          borderTopWidth: 2,
          borderTopColor: surface.border,
          height: 64 + bottom,
          paddingBottom: 8 + bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: true,
          header: () => (
            <HomeHeader
              onStreakPress={() => router.push('/stats')}
              onCoinPress={() => router.push('/profile/wallet')}
              onAvatarPress={() => router.push('/profile')}
            />
          ),
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
          tabBarButtonTestID: 'home-tab',
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Learn',
          headerShown: false,
          tabBarIcon: ({ color }) => <LearnIcon color={color} />,
          tabBarButtonTestID: 'learn-tab',
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: '',
          headerShown: false,
          tabBarButton: props => <CameraTabButton {...props} />,
          tabBarButtonTestID: 'camera-tab',
          tabBarStyle: { display: 'none' },
          // Dark behind the system navigation bar, like the camera itself.
          sceneStyle: { backgroundColor: '#000000' },
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          headerShown: false,
          tabBarIcon: ({ color }) => <CommunityIcon color={color} />,
          tabBarButtonTestID: 'community-tab',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color }) => <ProfileIcon color={color} />,
          tabBarButtonTestID: 'profile-tab',
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          href: null,
          title: 'Shop',
          headerShown: false,
        }}
      />
    </Tabs>
  );
}

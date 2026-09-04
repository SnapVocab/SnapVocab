import { useTheme } from '@react-navigation/native';
import { Tabs } from 'expo-router';

import { CameraTabButton } from '@/components/ui/camera-tab-button';
import {
  CommunityIcon,
  Home as HomeIcon,
  LearnIcon,
  ProfileIcon,
} from '@/components/ui/icons';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,
        headerRightContainerStyle: { paddingRight: 16 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
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
          // Full-bleed camera: the tab bar is hidden here, the in-screen
          // close (X) button is how the user leaves the scanner.
          tabBarStyle: { display: 'none' },
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
    </Tabs>
  );
}

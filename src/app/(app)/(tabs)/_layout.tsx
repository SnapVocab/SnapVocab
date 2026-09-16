import { Tabs } from 'expo-router';

import { CameraTabButton } from '@/components/ui/camera-tab-button';
import {
  CommunityIcon,
  Home as HomeIcon,
  LearnIcon,
  ProfileIcon,
} from '@/components/ui/icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#58CC02',
        tabBarInactiveTintColor: '#AFAFAF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 2,
          borderTopColor: '#F3F4F6',
          height: 64,
          paddingBottom: 8,
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

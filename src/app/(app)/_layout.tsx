import { useTheme } from '@react-navigation/native';
import { Redirect, Tabs } from 'expo-router';

import { Avatar, Text, View } from '@/components/ui';
import { CameraIcon, CommunityIcon, Home as HomeIcon, LearnIcon, ProfileIcon } from '@/components/ui/icons';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { Notification } from '@/features/home/components/notification';
import { translate } from '@/lib/i18n';

export default function AppLayout() {
  const { colors } = useTheme();
  const status = useAuthStore.use.status();
  const user = useAuthStore.use.user();

  const displayName = user?.firstName?.split('@')[0] ?? 'U';

  const userName = user?.firstName ?? 'User';

  const greetingKey = () => {
    const hour = new Date().getHours();
    if (hour < 12)
      return 'home.good_morning' as const;
    if (hour < 18)
      return 'home.good_afternoon' as const;
    return 'home.good_evening' as const;
  };

  if (status !== 'signIn') {
    return <Redirect href="/welcome" />;
  }

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
          headerTitle: '',
          headerLeft: () => (
            <View className="ml-4 flex-row items-center">
              <Avatar name={displayName} size={36} avatarUrl={user?.avatarUrl} />
              <View className="ml-2 flex-col">
                <Text
                  tx={greetingKey()}
                  className="text-[10px] font-bold text-[#3525CD] uppercase"
                />
                <Text className="text-[20px] font-bold">
                  {translate('home.greeting_name', { name: userName })}
                </Text>
              </View>
            </View>
          ),
          headerRight: () => <Notification unread={true} size={24} />,
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
          tabBarButtonTestID: 'home-tab',
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Learn',
          tabBarIcon: ({ color }) => <LearnIcon color={color} />,
          tabBarButtonTestID: 'learn-tab',
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Camera',
          tabBarIcon: ({ color }) => <CameraIcon color={color} />,
          tabBarButtonTestID: 'camera-tab',
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color }) => <CommunityIcon color={color} />,
          tabBarButtonTestID: 'community-tab',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <ProfileIcon color={color} />,
          tabBarButtonTestID: 'profile-tab',
        }}
      />
    </Tabs>
  );
}

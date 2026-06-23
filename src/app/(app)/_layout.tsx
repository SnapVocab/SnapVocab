import { Redirect, Tabs } from 'expo-router';

import { Home as HomeIcon } from '@/components/ui/icons';
import { useAuthStore } from '@/features/auth/use-auth-store';

export default function AppLayout() {
  const status = useAuthStore.use.status();

  if (status === 'signOut') {
    return <Redirect href="/welcome" />;
  }
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
          tabBarButtonTestID: 'home-tab',
        }}
      />
    </Tabs>
  );
}

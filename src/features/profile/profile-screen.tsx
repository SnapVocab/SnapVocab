import { Button, Text, View } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { useAuthStore } from '../auth/use-auth-store';

export function ProfileScreen() {
  const logout = useAuthStore.use.logout();
  return (
    <View className="flex-1 items-center justify-center">
      <Text tx="home.welcome" className="text-2xl font-bold text-neutral-900 dark:text-white" />
      <Button onPress={logout} label={translate('home.sign_out')} />
    </View>
  );
}

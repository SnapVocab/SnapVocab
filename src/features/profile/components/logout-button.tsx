import { useRouter } from 'expo-router';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { translate } from '@/lib/i18n';

export function LogoutButton() {
  const logout = useAuthStore.use.logout();
  const router = useRouter();

  return (
    <Button
      label={translate('home.sign_out')}
      className="mt-4 bg-red-500"
      onPress={() => {
        logout();
        router.replace('/welcome');
      }}
    />
  );
}

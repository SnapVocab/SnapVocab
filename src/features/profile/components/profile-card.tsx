import { View } from 'react-native';
import { Avatar, Text } from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { translate } from '@/lib/i18n';

export function ProfileCard() {
  const user = useAuthStore.use.user();

  if (!user)
    return null;

  const displayName = `${user.firstName} ${user.lastName}`;

  return (
    <View className="items-center justify-center gap-2 rounded-4xl bg-[#8253EC] p-4">
      <Avatar name={displayName} size={58} avatarUrl={user.avatarUrl} />
      <Text className="text-center text-xl font-extrabold text-white">{displayName}</Text>
      <Text className="text-center text-xs text-white">
        {translate('profile.level', { level: '12' })}
      </Text>
      <Text className="text-center text-sm text-white">{user.bio}</Text>
    </View>
  );
}

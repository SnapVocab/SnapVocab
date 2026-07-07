import { View } from 'react-native';
import { Avatar, Text } from '@/components/ui';

export function ProfileCard() {
  return (
    <View className="items-center justify-center gap-2 rounded-4xl bg-[#8253EC] p-4">
      <Avatar name="Minh Anh" size={58} />
      <Text className="text-center text-xl font-extrabold text-white">Minh Anh</Text>
      <Text className="text-center text-xs text-white">Level 12</Text>
      <Text className="text-center text-sm text-white">Learning 5 words a day 🦊 | Dreaming in English ✨</Text>
    </View>
  );
}

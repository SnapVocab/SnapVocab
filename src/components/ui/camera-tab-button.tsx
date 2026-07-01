import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { CameraIcon } from '@/components/ui/icons';

export function CameraIconButton() {
  return (
    <View className="-mt-5">
      <LinearGradient
        colors={['#6366f1', '#8b5cf6']}
        className="size-14 items-center justify-center rounded-full"
        style={{ elevation: 8 }}
      >
        <CameraIcon color="#fff" />
      </LinearGradient>
    </View>
  );
}

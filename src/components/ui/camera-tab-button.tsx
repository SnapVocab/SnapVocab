import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable } from 'react-native';
import { CameraIcon } from '@/components/ui/icons';

export function CameraTabButton({ onPress }: BottomTabBarButtonProps) {
  return (
    <Pressable onPress={onPress} className="items-center justify-center">
      <LinearGradient
        colors={['#6366f1', '#8b5cf6']}
        className="size-16 items-center justify-center shadow-lg shadow-indigo-500"
        style={{ elevation: 8, borderRadius: 9999, overflow: 'hidden' }}
      >
        <CameraIcon color="#fff" width={28} height={28} />
      </LinearGradient>
    </Pressable>
  );
}

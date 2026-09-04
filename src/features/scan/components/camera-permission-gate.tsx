import { LinearGradient } from 'expo-linear-gradient';
import { Pressable } from 'react-native';

import { Text, View } from '@/components/ui';
import { ImagesIcon } from '@/components/ui/icons';
import { Mascot } from '@/components/ui/mascot';

type CameraPermissionGateProps = {
  onRequestPermission: () => void;
  onPickFromLibrary: () => void;
};

export function CameraPermissionGate({
  onRequestPermission,
  onPickFromLibrary,
}: CameraPermissionGateProps) {
  return (
    <View
      style={{ flex: 1 }}
      className="flex-1 items-center justify-center gap-6 bg-black px-8"
    >
      <Mascot pose="wave" className="size-32" float />

      <View className="items-center gap-2">
        <Text className="text-center text-xl font-bold text-white" tx="scan.permission_title" />
        <Text className="text-center text-sm text-white/60" tx="scan.permission_subtitle" />
      </View>

      <View className="w-full gap-3">
        <Pressable
          onPress={onRequestPermission}
          testID="scan-grant-permission-button"
          className="h-14 overflow-hidden rounded-full"
        >
          <LinearGradient
            colors={['#6366f1', '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 9999 }}
          >
            <Text className="text-base font-bold text-white" tx="scan.grant_permission" />
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={onPickFromLibrary}
          testID="scan-choose-library-button"
          className="h-14 flex-row items-center justify-center gap-2 rounded-full bg-white/10"
        >
          <ImagesIcon color="#fff" />
          <Text className="text-base font-bold text-white" tx="scan.choose_library" />
        </Pressable>
      </View>
    </View>
  );
}

import { ScrollView } from 'react-native';
import { withUniwind } from 'uniwind';
import { Button, Mascot, SafeAreaView, Text, useSurface, View } from '@/components/ui';
import { ImagesIcon } from '@/components/ui/icons';

const SafeArea = withUniwind(SafeAreaView);

type Props = {
  onRequestPermission: () => void;
  onPickFromLibrary: () => void;
  onClose: () => void;
};

export function CameraPermissionGate({ onRequestPermission, onPickFromLibrary, onClose }: Props) {
  const surface = useSurface();
  return (
    <SafeArea className="flex-1 bg-background">
      <ScrollView contentContainerClassName="grow items-center justify-center p-6">
        <View className="w-full max-w-md items-center rounded-2xl border-2 border-b-4 border-line border-b-edge bg-surface p-5">
          <Mascot pose="wave" className="mb-4 size-28" />
          <Text accessibilityRole="header" className="mb-2 text-center font-nunito text-[22px] font-extrabold text-mascot-navy dark:text-white" tx="scan.permission_title" />
          <Text className="mb-6 text-center text-sm/6 text-neutral-600 dark:text-neutral-300" tx="scan.permission_subtitle" />

          <Button
            tx="scan.grant_permission"
            fullWidth
            onPress={onRequestPermission}
            testID="scan-grant-permission-button"
            className="mb-3"
          />
          <Button
            tx="scan.choose_library"
            variant="outline"
            fullWidth
            icon={<ImagesIcon color={surface.textMuted} />}
            onPress={onPickFromLibrary}
            testID="scan-permission-library-button"
            className="mb-3"
          />
          <Button tx="scan.back_home" variant="ghost" fullWidth onPress={onClose} />
        </View>
      </ScrollView>
    </SafeArea>
  );
}

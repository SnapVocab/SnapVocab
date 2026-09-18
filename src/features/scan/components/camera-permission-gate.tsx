import { Button, Mascot, Text, View } from '@/components/ui';
import { ImagesIcon } from '@/components/ui/icons';

type Props = {
  onRequestPermission: () => void;
  onPickFromLibrary: () => void;
  onClose: () => void;
};

export function CameraPermissionGate({ onRequestPermission, onPickFromLibrary, onClose }: Props) {
  return (
    <View style={{ flex: 1 }} className="flex-1 items-center justify-center bg-neutral-900 px-6">
      <View className="w-full max-w-[360px] items-center rounded-[32px] border-b-[6px] border-neutral-200 bg-white p-6">
        <Mascot pose="wave" float className="mb-2 size-28" />
        <Text className="mb-2 text-center font-nunito text-[22px] font-extrabold text-mascot-navy" tx="scan.permission_title" />
        <Text className="mb-6 text-center text-sm text-neutral-500" tx="scan.permission_subtitle" />

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
          icon={<ImagesIcon color="#1CB0F6" />}
          onPress={onPickFromLibrary}
          testID="scan-permission-library-button"
          className="mb-3"
        />
        <Button tx="scan.back_home" variant="ghost" fullWidth onPress={onClose} />
      </View>
    </View>
  );
}

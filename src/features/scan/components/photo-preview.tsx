import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BouncingDots, Button, Image, Text, View } from '@/components/ui';
import { CameraIcon, SparklesIcon } from '@/components/ui/icons';

type Props = {
  uri: string;
  /** True while the photo is being uploaded and queued. */
  sending: boolean;
  onRetake: () => void;
  onSend: () => void;
};

/**
 * Lets the user check the shot before it costs a scan: nothing is uploaded
 * until they press Send.
 */
export function PhotoPreview({ uri, sending, onRetake, onSend }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }} className="flex-1 bg-black">
      <View style={{ flex: 1, marginTop: insets.top }}>
        <Image source={{ uri }} contentFit="contain" style={StyleSheet.absoluteFill} />

        {sending && (
          <View style={StyleSheet.absoluteFill} className="items-center justify-center bg-black/50">
            <View className="items-center rounded-3xl border border-white/15 bg-black/75 px-7 py-5">
              <Text className="mb-3 text-center font-nunito text-lg font-extrabold text-white" tx="scan.uploading" />
              <BouncingDots color="#7DD634" />
            </View>
          </View>
        )}
      </View>

      <View style={{ paddingBottom: insets.bottom + 16 }} className="gap-3 bg-black px-5 pt-4">
        <Text className="text-center text-sm text-white/70" tx="scan.preview.hint" />
        <View className="flex-row gap-3">
          <Button
            tx="scan.preview.retake"
            variant="white"
            icon={<CameraIcon color="#3D3F5E" width={20} height={20} />}
            disabled={sending}
            onPress={onRetake}
            testID="scan-preview-retake"
            className="h-14 flex-1"
          />
          <Button
            tx="scan.preview.send"
            icon={<SparklesIcon color="#FFFFFF" width={18} height={18} />}
            disabled={sending}
            onPress={onSend}
            testID="scan-preview-send"
            className="h-14 flex-1"
          />
        </View>
      </View>
    </View>
  );
}

import { useRouter } from 'expo-router';

import { Button, FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { CameraIcon } from '@/components/ui/icons';

export function CameraScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-black">
      <FocusAwareStatusBar />
      <View className="flex-1 items-center justify-center p-6">
        <View className="size-24 items-center justify-center rounded-full bg-neutral-800">
          <CameraIcon color="#ffffff" width={48} height={48} />
        </View>
        <Text className="mt-6 text-2xl font-black text-white">
          Camera Scanner
        </Text>
        <Text className="mt-2 text-center text-sm font-medium text-neutral-400">
          AI Object Detection & Flashcard Scanner coming soon
        </Text>
        <Button
          label="Back to Home"
          variant="outline"
          size="default"
          onPress={() => router.back()}
          className="mt-8 border-white/20"
          textClassName="text-white"
        />
      </View>
    </SafeAreaView>
  );
}

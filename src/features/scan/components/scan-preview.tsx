import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { Image, Text, View } from '@/components/ui';
import { CloseIcon, SparklesIcon } from '@/components/ui/icons';

type ScanPreviewProps = {
  imageUri: string;
  isDetecting: boolean;
  onRetake: () => void;
  onDetect: () => void;
};

export function ScanPreview({ imageUri, isDetecting, onRetake, onDetect }: ScanPreviewProps) {
  return (
    <View style={{ flex: 1 }} className="flex-1 bg-black">
      <View style={{ flex: 1 }} className="flex-1 overflow-hidden">
        <Image
          source={{ uri: imageUri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          alt="Captured photo"
        />

        <View className="absolute inset-x-0 top-0 flex-row items-center justify-between p-4">
          <Pressable
            onPress={onRetake}
            disabled={isDetecting}
            testID="scan-retake-button"
            className="size-10 items-center justify-center rounded-full bg-black/40"
          >
            <CloseIcon color="#fff" width={20} height={20} />
          </Pressable>

          <View className="flex-row items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5">
            <SparklesIcon color="#fff" />
            <Text className="text-xs font-bold text-white" tx="scan.ai_vision" />
          </View>

          <View className="size-10" />
        </View>

        {isDetecting && (
          <View className="absolute inset-0 items-center justify-center bg-black/60">
            <ActivityIndicator size="large" color="#FFF" />
            <Text className="mt-3 font-bold text-white" tx="scan.detecting" />
            <Text className="mt-1 text-sm text-white/70" tx="scan.detecting_hint" />
          </View>
        )}
      </View>

      <View className="flex-row items-center gap-3 bg-black p-6">
        <Pressable
          onPress={onRetake}
          disabled={isDetecting}
          testID="scan-retake-text-button"
          style={{ flex: 1 }}
          className="h-14 flex-1 items-center justify-center rounded-full bg-white/10"
        >
          <Text className="text-base font-bold text-white" tx="scan.retake" />
        </Pressable>

        <Pressable
          onPress={onDetect}
          disabled={isDetecting}
          testID="scan-detect-button"
          style={{ flex: 1 }}
          className="h-14 flex-1 overflow-hidden rounded-full"
        >
          <LinearGradient
            colors={isDetecting ? ['#4b5563', '#4b5563'] : ['#6366f1', '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 9999 }}
          >
            {isDetecting
              ? <ActivityIndicator color="#FFF" />
              : <Text className="text-base font-bold text-white" tx="scan.words" />}
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

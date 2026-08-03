import type { CameraView as CameraViewType } from 'expo-camera';
import { CameraView } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import { Pressable } from 'react-native';

import { Text, View } from '@/components/ui';
import { CloseIcon, FlashIcon, FlashOffIcon, ImagesIcon, SparklesIcon } from '@/components/ui/icons';

export type CapturedPhoto = {
  uri: string;
  width: number;
  height: number;
};

type CameraLiveViewProps = {
  onClose: () => void;
  onCaptured: (photo: CapturedPhoto) => void;
  onPickFromLibrary: () => void;
};

export function CameraLiveView({ onClose, onCaptured, onPickFromLibrary }: CameraLiveViewProps) {
  const cameraRef = useRef<CameraViewType>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const capture = async () => {
    if (!cameraRef.current || isCapturing)
      return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo)
        onCaptured({ uri: photo.uri, width: photo.width, height: photo.height });
    }
    finally {
      setIsCapturing(false);
    }
  };

  return (
    <View style={{ flex: 1 }} className="flex-1 bg-black">
      <View style={{ flex: 1 }} className="flex-1 overflow-hidden">
        {/* `flash` only fires at capture time, so `enableTorch` is what actually
            lights up the scene when the user toggles the button. */}
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing="back"
          flash={flashOn ? 'on' : 'off'}
          enableTorch={flashOn}
        />

        {/* Framing guide */}
        <View
          pointerEvents="none"
          className="absolute inset-x-8 top-[22%] rounded-3xl border-2 border-white/50 p-5"
        >
          <View className="gap-3 rounded-2xl bg-white/10 p-4">
            <View className="h-3 w-4/5 rounded-full bg-white/70" />
            <View className="h-3 w-full rounded-full bg-white/50" />
            <View className="h-3 w-2/3 rounded-full bg-white/60" />
          </View>
        </View>

        {/* Top controls */}
        <View className="absolute inset-x-0 top-0 flex-row items-center justify-between p-4">
          <Pressable
            onPress={onClose}
            testID="scan-close-button"
            className="size-10 items-center justify-center rounded-full bg-black/40"
          >
            <CloseIcon color="#fff" width={20} height={20} />
          </Pressable>

          <View className="flex-row items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5">
            <SparklesIcon color="#fff" />
            <Text className="text-xs font-bold text-white" tx="scan.ai_vision" />
          </View>

          <Pressable
            onPress={() => setFlashOn(on => !on)}
            testID="scan-flash-button"
            className="size-10 items-center justify-center rounded-full bg-black/40"
          >
            {flashOn
              ? <FlashIcon color="#FBBF24" width={20} height={20} />
              : <FlashOffIcon color="#fff" width={20} height={20} />}
          </Pressable>
        </View>

        {/* Bottom hint card */}
        <View className="absolute inset-x-5 bottom-5 rounded-3xl bg-black/50 p-4">
          <Text className="text-center text-sm font-bold text-white" tx="scan.hint_title" />
          <Text className="mt-1 text-center text-xs text-white/70" tx="scan.hint_subtitle" />
        </View>
      </View>

      {/* Bottom bar */}
      <View className="flex-row items-center justify-between bg-black px-10 py-6">
        <Pressable
          onPress={onPickFromLibrary}
          testID="scan-choose-library-button"
          className="size-12 items-center justify-center rounded-2xl bg-white/10"
        >
          <ImagesIcon color="#fff" />
        </Pressable>

        <Pressable
          onPress={capture}
          disabled={isCapturing}
          testID="scan-capture-button"
          className="size-20 items-center justify-center rounded-full border-4 border-white/40"
        >
          <LinearGradient
            colors={['#6366f1', '#8b5cf6']}
            style={{ width: 64, height: 64, borderRadius: 32 }}
          />
        </Pressable>

        <View className="size-12" />
      </View>
    </View>
  );
}

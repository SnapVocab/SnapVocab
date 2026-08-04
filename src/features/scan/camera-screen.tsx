import type { CapturedPhoto } from './components/camera-live-view';
import { useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { SystemBars } from 'react-native-edge-to-edge';

import { SafeAreaView, showErrorMessage, View } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { useScanImage } from './api';
import { CameraLiveView } from './components/camera-live-view';
import { CameraPermissionGate } from './components/camera-permission-gate';
import { ScanPreview } from './components/scan-preview';
import { useScanStore } from './use-scan-store';

type PickedPhoto = CapturedPhoto & { mimeType?: string };

export function CameraScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const scanMutation = useScanImage();
  const setResult = useScanStore.use.setResult();

  const pickFromLibrary = async () => {
    try {
      const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!libraryPermission.granted) {
        showErrorMessage(translate('scan.permission_library_denied'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        // Full quality: re-encoding at 0.8 measurably cost ~30% of the detections
        // (16 labels -> 11 on the same photo).
        quality: 1,
      });
      if (!result.canceled) {
        const asset = result.assets[0];
        setPhoto({
          uri: asset.uri,
          mimeType: asset.mimeType,
          width: asset.width,
          height: asset.height,
        });
      }
    }
    catch {
      showErrorMessage(translate('scan.pick_error'));
    }
  };

  const detect = () => {
    if (!photo)
      return;

    const fileName = photo.uri.split('/').pop() ?? 'photo.jpg';
    scanMutation.mutate(
      { uri: photo.uri, fileName, mimeType: photo.mimeType },
      {
        onSuccess: (data) => {
          setResult(data);
          router.push('/scan-results');
        },
        onError: (error) => {
          // Surfaced in `adb logcat` — the message alone rarely says why an
          // upload failed (network vs. 4xx vs. timeout).
          console.log('[Scan] detect failed:', error.message, error.response?.status, JSON.stringify(error.response?.data));
          showErrorMessage(translate('scan.error'));
        },
      },
    );
  };

  const renderContent = () => {
    if (photo) {
      return (
        <ScanPreview
          imageUri={photo.uri}
          isDetecting={scanMutation.isPending}
          onRetake={() => setPhoto(null)}
          onDetect={detect}
        />
      );
    }

    if (!permission?.granted) {
      return (
        <CameraPermissionGate
          onRequestPermission={requestPermission}
          onPickFromLibrary={pickFromLibrary}
        />
      );
    }

    return (
      <CameraLiveView
        onClose={() => router.replace('/')}
        onCaptured={setPhoto}
        onPickFromLibrary={pickFromLibrary}
      />
    );
  };

  return (
    // `flex-1` as a class is unreliable in this uniwind setup, so layout-critical
    // containers set flex inline too (same workaround as the auth screens).
    <View style={{ flex: 1 }} className="flex-1 bg-black">
      <SystemBars style="light" />
      <SafeAreaView style={{ flex: 1 }} className="flex-1">
        {renderContent()}
      </SafeAreaView>
    </View>
  );
}

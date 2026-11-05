import type { StartScanRequest } from './api';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FocusAwareStatusBar, showErrorMessage, View } from '@/components/ui';
import { CloseIcon, FlashIcon, FlashOffIcon, ImagesIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';
import { useScanQuota, useStartScan } from './api';
import { CameraPermissionGate } from './components/camera-permission-gate';
import { CameraViewfinder } from './components/camera-viewfinder';
import { PhotoPreview } from './components/photo-preview';
import { QuotaBadge } from './components/quota-badge';
import { QuotaExhaustedCard } from './components/quota-exhausted-card';
import { pickScanPictureSize } from './picture-size';
import { scanFailureMessageKey, toScanFailure } from './scan-errors';

export function CameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isFocused, setIsFocused] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [pictureSize, setPictureSize] = useState<string>();
  // The shot being reviewed; nothing is uploaded until the user presses Send.
  const [photo, setPhoto] = useState<StartScanRequest | null>(null);

  const quota = useScanQuota();
  const { refetch: refetchQuota } = quota;
  const startScan = useStartScan();
  const exhausted = quota.data !== undefined && quota.data.remaining <= 0;

  // Tabs keep screens mounted: release the camera (and refresh the quota)
  // whenever the user leaves and comes back.
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      refetchQuota();
      return () => setIsFocused(false);
    }, [refetchQuota]),
  );

  const close = () => router.replace('/');

  const send = () => {
    if (!photo)
      return;
    startScan.mutate(photo, {
      onSuccess: ({ requestId }) => {
        router.push({
          pathname: '/scan-result',
          params: { requestId, imageUri: photo.uri, mimeType: photo.mimeType ?? '' },
        });
        setPhoto(null);
      },
      onError: (error) => {
        const failure = toScanFailure(error);
        if (failure === 'QUOTA_EXCEEDED') {
          // Back to the camera, where the exhausted card explains the limit.
          setPhoto(null);
          return;
        }
        // Keep the preview so the user can simply press Send again.
        showErrorMessage(translate(scanFailureMessageKey(failure)));
      },
    });
  };

  const choosePictureSize = async () => {
    if (pictureSize || !cameraRef.current)
      return;
    try {
      setPictureSize(pickScanPictureSize(await cameraRef.current.getAvailablePictureSizesAsync()));
    }
    catch {
      // keep the camera's default size
    }
  };

  const capture = async () => {
    if (!cameraRef.current || exhausted)
      return;
    try {
      // Full quality: re-encoding at 0.8 measurably cost ~30% of the detections.
      const shot = await cameraRef.current.takePictureAsync({ quality: 1 });
      if (shot)
        setPhoto({ uri: shot.uri, mimeType: 'image/jpeg' });
    }
    catch {
      showErrorMessage(translate('scan.pick_error'));
    }
  };

  const pickFromLibrary = async () => {
    if (exhausted)
      return;
    try {
      const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!libraryPermission.granted) {
        showErrorMessage(translate('scan.permission_library_denied'));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
      if (!result.canceled)
        setPhoto({ uri: result.assets[0].uri, mimeType: result.assets[0].mimeType });
    }
    catch {
      showErrorMessage(translate('scan.pick_error'));
    }
  };

  const preview = photo && (
    <PhotoPreview
      uri={photo.uri}
      sending={startScan.isPending}
      onRetake={() => setPhoto(null)}
      onSend={send}
    />
  );

  // No camera to keep alive (a library pick without camera permission): show the preview alone.
  if (preview && !permission?.granted) {
    return (
      <>
        <FocusAwareStatusBar style="light" />
        {preview}
      </>
    );
  }

  // Permission status is still loading: render nothing rather than a camera we may not use.
  if (!permission)
    return <View style={{ flex: 1 }} className="flex-1 bg-black" />;

  if (!permission.granted) {
    return (
      <>
        <FocusAwareStatusBar style="light" />
        <CameraPermissionGate
          onRequestPermission={requestPermission}
          onPickFromLibrary={pickFromLibrary}
          onClose={close}
        />
      </>
    );
  }

  return (
    <View style={{ flex: 1 }} className="flex-1 bg-black">
      <FocusAwareStatusBar style="light" />

      <View style={StyleSheet.absoluteFill}>
        {isFocused && (
          // `flash` only fires at capture time; `enableTorch` lights the scene while framing.
          // The preview is drawn over a paused camera instead of replacing it: remounting
          // CameraView on Retake left the Android preview sized to half the screen.
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            active={!photo}
            pictureSize={pictureSize}
            onCameraReady={choosePictureSize}
            flash={flashOn ? 'on' : 'off'}
            enableTorch={flashOn && !photo}
          />
        )}
      </View>
      <View pointerEvents="none" style={StyleSheet.absoluteFill} className="bg-black/35" />

      {/* Top controls */}
      <View style={{ paddingTop: Math.max(insets.top, 16) }} className="flex-row items-center justify-between px-5 pb-3">
        <Pressable
          onPress={close}
          testID="scan-close-button"
          className="size-11 items-center justify-center rounded-full border border-white/20 bg-black/50"
        >
          <CloseIcon color="#fff" width={20} height={20} />
        </Pressable>
        <QuotaBadge quota={quota.data} />
        <Pressable
          onPress={() => setFlashOn(on => !on)}
          testID="scan-flash-button"
          className="size-11 items-center justify-center rounded-full border border-white/20 bg-black/50"
        >
          {flashOn
            ? <FlashIcon color="#FBBF24" width={20} height={20} />
            : <FlashOffIcon color="#fff" width={20} height={20} />}
        </Pressable>
      </View>

      {/* Centre */}
      {exhausted && quota.data
        ? (
            <View style={{ flex: 1 }} className="flex-1 items-center justify-center px-6">
              <QuotaExhaustedCard quota={quota.data} onReview={() => router.replace('/learn')} onClose={close} />
            </View>
          )
        : <CameraViewfinder />}

      {/* Bottom controls */}
      <View
        style={{ paddingBottom: Math.max(insets.bottom, 24), minHeight: 104 }}
        className="flex-row items-center justify-between px-8 pt-4"
      >
        {!exhausted && (
          <>
            <Pressable
              onPress={pickFromLibrary}
              testID="scan-choose-library-button"
              className="size-14 items-center justify-center rounded-full border border-white/20 bg-black/50"
            >
              <ImagesIcon color="#fff" />
            </Pressable>

            <Pressable
              onPress={capture}
              testID="scan-capture-button"
              className="size-20 items-center justify-center rounded-full border-4 border-white/40 active:scale-90"
            >
              {/* Concentric circles: equal borders all round keep the centre truly centred. */}
              <View className="size-16 items-center justify-center rounded-full bg-white">
                <View className="size-12 rounded-full border-2 border-primary-500/40 bg-primary-500/10" />
              </View>
            </Pressable>

            <View className="size-14" />
          </>
        )}
      </View>

      {preview && <View style={StyleSheet.absoluteFill}>{preview}</View>}
    </View>
  );
}

import type { StartScanRequest } from './api';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BouncingDots, Image, showErrorMessage, Text, View } from '@/components/ui';
import { CloseIcon, FlashIcon, FlashOffIcon, ImagesIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';
import { useScanQuota, useStartScan } from './api';
import { CameraPermissionGate } from './components/camera-permission-gate';
import { CameraViewfinder } from './components/camera-viewfinder';
import { QuotaBadge } from './components/quota-badge';
import { QuotaExhaustedCard } from './components/quota-exhausted-card';
import { scanFailureMessageKey, toScanFailure } from './scan-errors';

export function CameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isFocused, setIsFocused] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [pendingUri, setPendingUri] = useState<string | null>(null);

  const quota = useScanQuota();
  const { refetch: refetchQuota } = quota;
  const startScan = useStartScan();
  const exhausted = quota.data !== undefined && quota.data.remaining <= 0;
  const busy = startScan.isPending;

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

  const submit = (photo: StartScanRequest) => {
    setPendingUri(photo.uri);
    startScan.mutate(photo, {
      onSuccess: ({ requestId }) => {
        router.push({
          pathname: '/scan-result',
          params: { requestId, imageUri: photo.uri, mimeType: photo.mimeType ?? '' },
        });
      },
      onError: (error) => {
        const failure = toScanFailure(error);
        // The exhausted card replaces the camera once the quota refetch lands.
        if (failure !== 'QUOTA_EXCEEDED')
          showErrorMessage(translate(scanFailureMessageKey(failure)));
      },
      onSettled: () => setPendingUri(null),
    });
  };

  const capture = async () => {
    if (!cameraRef.current || busy || exhausted)
      return;
    try {
      // Full quality: re-encoding at 0.8 measurably cost ~30% of the detections.
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      if (photo)
        submit({ uri: photo.uri, mimeType: 'image/jpeg' });
    }
    catch {
      showErrorMessage(translate('scan.pick_error'));
    }
  };

  const pickFromLibrary = async () => {
    if (busy || exhausted)
      return;
    try {
      const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!libraryPermission.granted) {
        showErrorMessage(translate('scan.permission_library_denied'));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
      if (!result.canceled)
        submit({ uri: result.assets[0].uri, mimeType: result.assets[0].mimeType });
    }
    catch {
      showErrorMessage(translate('scan.pick_error'));
    }
  };

  // Permission status is still loading: render nothing rather than a camera we may not use.
  if (!permission)
    return <View style={{ flex: 1 }} className="flex-1 bg-black" />;

  if (!permission.granted) {
    return (
      <>
        <SystemBars style="light" />
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
      <SystemBars style="light" />

      <View style={StyleSheet.absoluteFill}>
        {pendingUri
          ? <Image source={{ uri: pendingUri }} contentFit="cover" style={StyleSheet.absoluteFill} />
          : isFocused && (
            // `flash` only fires at capture time; `enableTorch` lights the scene while framing.
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing="back"
              flash={flashOn ? 'on' : 'off'}
              enableTorch={flashOn}
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
        {!busy && <QuotaBadge quota={quota.data} />}
        <Pressable
          onPress={() => setFlashOn(on => !on)}
          disabled={busy}
          testID="scan-flash-button"
          className="size-11 items-center justify-center rounded-full border border-white/20 bg-black/50"
        >
          {flashOn
            ? <FlashIcon color="#FBBF24" width={20} height={20} />
            : <FlashOffIcon color="#fff" width={20} height={20} />}
        </Pressable>
      </View>

      {/* Centre */}
      {busy
        ? (
            <View style={{ flex: 1 }} className="flex-1 items-center justify-center px-6">
              <View className="items-center rounded-[28px] border border-white/15 bg-black/75 px-7 py-5">
                <Text className="mb-3 text-center font-nunito text-lg font-extrabold text-white" tx="scan.uploading" />
                <BouncingDots color="#7DD634" />
              </View>
            </View>
          )
        : exhausted && quota.data
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
        {!busy && !exhausted && (
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
              className="size-20 items-center justify-center rounded-full bg-white/20 p-1.5 active:scale-90"
            >
              <View className="size-[68px] items-center justify-center rounded-full border-b-[5px] border-neutral-300 bg-white">
                <View className="size-12 rounded-full border-2 border-primary-500/30 bg-primary-500/10" />
              </View>
            </Pressable>

            <View className="size-14" />
          </>
        )}
      </View>
    </View>
  );
}

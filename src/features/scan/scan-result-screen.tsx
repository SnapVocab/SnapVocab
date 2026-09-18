import type { ScanFailure } from './scan-errors';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, FocusAwareStatusBar, Mascot, SafeAreaView, showErrorMessage, Text, View } from '@/components/ui';
import { CameraIcon, ChevronLeftIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';
import { useScanStatus, useStartScan } from './api';
import { DetectedItemCard } from './components/detected-item-card';
import { DetectionImage } from './components/detection-image';
import { ScanFailed } from './components/scan-failed';
import { ScanWaiting } from './components/scan-waiting';
import { scanFailureMessageKey, toScanFailure } from './scan-errors';

type Params = {
  requestId: string;
  imageUri: string;
  mimeType?: string;
};

export function ScanResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<Params>();
  const [requestId, setRequestId] = useState(params.requestId);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [acceptedAt, setAcceptedAt] = useState(() => Date.now());
  const scrollRef = useRef<ScrollView>(null);
  // Card y is measured inside the list, so the list's own y is added when scrolling.
  const listOffset = useRef(0);
  const cardOffsets = useRef<Record<number, number>>({});

  const scan = useScanStatus(requestId);
  const resubmit = useStartScan();
  const backToCamera = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const retry = () => {
    resubmit.mutate(
      { uri: params.imageUri, mimeType: params.mimeType },
      {
        onSuccess: (data) => {
          setSelectedIndex(null);
          setAcceptedAt(Date.now());
          setRequestId(data.requestId);
        },
        onError: error => showErrorMessage(translate(scanFailureMessageKey(toScanFailure(error)))),
      },
    );
  };

  const selectFromImage = (index: number) => {
    setSelectedIndex(index);
    const y = cardOffsets.current[index];
    if (y !== undefined)
      scrollRef.current?.scrollTo({ y: Math.max(0, listOffset.current + y - 12), animated: true });
  };

  const data = scan.data;
  let failure: ScanFailure | null = null;
  if (data?.status === 'FAILED')
    failure = data.errorCode ?? 'UNKNOWN';
  else if (scan.isError && !data)
    failure = toScanFailure(scan.error);

  const result = data?.status === 'DONE' ? data.result : null;
  const items = result?.items ?? [];
  const allLow = items.length > 0 && items.every(item => item.reliability === 'LOW');

  const header = (
    <View className="h-14 flex-row items-center border-b border-neutral-100 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-900">
      <Pressable onPress={backToCamera} testID="scan-result-back" className="-ml-1 size-10 items-center justify-center rounded-full active:bg-neutral-100">
        <ChevronLeftIcon color="#1E2A44" />
      </Pressable>
      <Text className="mr-9 flex-1 text-center font-nunito text-lg font-extrabold text-mascot-navy dark:text-white" tx="scan.result.title" />
    </View>
  );

  if (failure) {
    return (
      <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background" edges={['top', 'bottom']}>
        <FocusAwareStatusBar />
        {header}
        <ScanFailed
          failure={failure}
          retrying={resubmit.isPending}
          // Failed poll (e.g. network): poll again. Failed scan: re-submit the photo.
          onRetry={data?.status === 'FAILED' ? retry : () => scan.refetch()}
          onBackToCamera={backToCamera}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-[#F7F8FA] dark:bg-neutral-950" edges={['top']}>
      <FocusAwareStatusBar />
      {header}

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: result ? 140 : 32 }}
        showsVerticalScrollIndicator={false}
      >
        <DetectionImage
          imageUri={params.imageUri}
          result={result}
          selectedIndex={selectedIndex}
          onSelect={selectFromImage}
        />

        {!result && (
          <ScanWaiting
            status={data?.status}
            startedAt={data?.createdAt ? Date.parse(data.createdAt) : acceptedAt}
            onCancel={backToCamera}
          />
        )}

        {result && items.length === 0 && (
          <View className="items-center px-4 py-8">
            <Mascot pose="sad" className="mb-4 size-28" />
            <Text className="mb-2 text-center font-nunito text-xl font-extrabold text-mascot-navy dark:text-white" tx="scan.result.empty_title" />
            <Text className="mb-6 text-center text-sm text-neutral-500" tx="scan.result.empty_subtitle" />
            <Button tx="scan.result.try_other" onPress={backToCamera} className="px-6" />
          </View>
        )}

        {allLow && (
          <View className="mt-4 items-center rounded-2xl border border-reward-200 bg-reward-50 p-4">
            <Text className="mb-1 text-center font-nunito text-base font-extrabold text-mascot-navy" tx="scan.result.all_low_title" />
            <Text className="text-center text-[13px] text-neutral-500" tx="scan.result.all_low_subtitle" />
          </View>
        )}

        {items.length > 0 && (
          <View
            className="mt-4 gap-4"
            onLayout={(e) => {
              listOffset.current = e.nativeEvent.layout.y;
            }}
          >
            {items.map((item, index) => (
              <View
                // eslint-disable-next-line react/no-array-index-key -- fixed order per result
                key={index}
                onLayout={(e) => {
                  cardOffsets.current[index] = e.nativeEvent.layout.y;
                }}
              >
                <DetectedItemCard
                  item={item}
                  selected={selectedIndex === index}
                  onPress={() => setSelectedIndex(index)}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {items.length > 0 && (
        <View
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          className="absolute inset-x-0 bottom-0 flex-row gap-3 border-t border-neutral-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <Button
            variant="white"
            size="icon"
            icon={<CameraIcon color="#3D3F5E" />}
            onPress={backToCamera}
            testID="scan-retake-button"
            className="size-14"
            accessibilityLabel={translate('scan.result.retake')}
          />
          <Button tx="scan.result.save_all" disabled className="h-14 flex-1" />
        </View>
      )}
    </SafeAreaView>
  );
}

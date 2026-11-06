import type { ScanFailure } from './scan-errors';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton, Button, FocusAwareStatusBar, Mascot, SafeAreaView, showErrorMessage, Text, View } from '@/components/ui';
import { CameraIcon, SparklesIcon } from '@/components/ui/icons';
import { useColorMode } from '@/components/ui/surface';
import { translate } from '@/lib/i18n';
import { useScanStatus, useStartScan } from './api';
import { DetectedItemCard } from './components/detected-item-card';
import { DetectionImage } from './components/detection-image';
import { ScanFailed } from './components/scan-failed';
import { ScanWaiting } from './components/scan-waiting';
import { boxColor } from './display';
import { scanFailureMessageKey, toScanFailure } from './scan-errors';

type Params = {
  requestId: string;
  imageUri: string;
  mimeType?: string;
};

export function ScanResultScreen() {
  const isDark = useColorMode() === 'dark';
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
    <View className="h-14 flex-row items-center border-b border-line bg-surface px-4">
      <BackButton onPress={backToCamera} testID="scan-result-back" />
      <Text
        className="flex-1 text-center font-nunito text-lg font-extrabold text-mascot-navy dark:text-white"
        tx="scan.result.title"
      />
      {/* Same width as the back button so the title is truly centred. */}
      <View className="size-10" />
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
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background dark:bg-neutral-950" edges={['top']}>
      <FocusAwareStatusBar />
      {header}

      <ScrollView
        // A new key when results land remounts the list at the top; scrolling
        // imperatively raced the layout of the new content and was ignored.
        key={result ? `result-${requestId}` : `waiting-${requestId}`}
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

        {result && items.length > 0 && (
          <View className="mt-3 flex-row items-center gap-1.5 px-1">
            <SparklesIcon color="#58CC02" />
            <Text className="font-nunito text-sm font-bold text-neutral-600 dark:text-neutral-300">
              {translate('scan.result.found', { count: items.length })}
            </Text>
          </View>
        )}

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
            className="mt-3 gap-3"
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
                  color={boxColor(index)}
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
          style={{ paddingBottom: insets.bottom + 12 }}
          className="absolute inset-x-0 bottom-0 flex-row gap-3 border-t border-line bg-surface p-4"
        >
          <Button
            tx="my_words.open"
            onPress={() => router.push({ pathname: '/my-words', params: { scanRequestId: requestId } })}
            className="h-auto min-h-14 flex-1 py-3"
            textClassName="shrink"
          />
          <Button
            variant="white"
            icon={<CameraIcon color={isDark ? '#F3F4F6' : '#3D3F5E'} />}
            accessibilityLabel={translate('scan.result.retake')}
            onPress={backToCamera}
            testID="scan-retake-button"
            size="icon"
            className="size-14"
          />
        </View>
      )}
    </SafeAreaView>
  );
}

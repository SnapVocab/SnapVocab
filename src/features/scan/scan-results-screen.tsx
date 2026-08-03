import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView } from 'react-native';

import { FocusAwareStatusBar, Pill, SafeAreaView, Text, View } from '@/components/ui';
import { BackButton } from '@/components/ui/back-button';
import { translate } from '@/lib/i18n';
import { ChooseWordsCard } from './components/choose-words-card';
import { DetectedItemCard } from './components/detected-item-card';
import { DetectionOverlay } from './components/detection-overlay';
import { ScanResultsActions } from './components/scan-results-actions';
import { ScanResultsEmpty } from './components/scan-results-empty';
import { useScanStore } from './use-scan-store';

function itemKey(label: string, x1: number, y1: number) {
  return `${label}-${x1}-${y1}`;
}

export function ScanResultsScreen() {
  const router = useRouter();
  const photo = useScanStore.use.photo();
  const results = useScanStore.use.results();
  const reset = useScanStore.use.reset();

  const [selected, setSelected] = useState<string[]>(() =>
    results.map(r => itemKey(r.label, r.box.x1, r.box.y1)));
  const [showBoxes, setShowBoxes] = useState(true);

  // A label detected more than once (e.g. two chairs) gets flagged so the user
  // can skip the extra copies instead of creating duplicate flashcards.
  const labelCounts = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.label] = (acc[r.label] ?? 0) + 1;
    return acc;
  }, {});

  const toggle = (key: string) =>
    setSelected(s => (s.includes(key) ? s.filter(k => k !== key) : [...s, key]));

  const retake = () => {
    reset();
    router.replace('/camera');
  };

  if (results.length === 0 || !photo)
    return <ScanResultsEmpty onBack={() => router.back()} onRetake={retake} />;

  return (
    <View style={{ flex: 1 }} className="flex-1 bg-gray-50 dark:bg-neutral-950">
      <SafeAreaView style={{ flex: 1 }} className="flex-1">
        <FocusAwareStatusBar />

        <View className="flex-row items-center gap-3 bg-white px-5 py-3 dark:bg-neutral-900">
          <BackButton onPress={() => router.back()} />
          <Text style={{ flex: 1 }} className="flex-1 text-[18px] font-bold" tx="scan.results_title" />
          <Pill
            label={`${selected.length}/${results.length}`}
            className="bg-success-100 dark:bg-neutral-800"
            textClassName="text-success-700 dark:text-success-300"
          />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerClassName="gap-3 pb-5">
          <View>
            <DetectionOverlay photo={photo} results={results} showBoxes={showBoxes} />
            <Pressable
              onPress={() => setShowBoxes(v => !v)}
              testID="scan-toggle-boxes-button"
              className="absolute bottom-3 self-center rounded-full bg-black/60 px-4 py-2"
            >
              <Text className="text-xs font-bold text-white">
                {translate(showBoxes ? 'scan.hide_detections' : 'scan.show_detections')}
              </Text>
            </Pressable>
          </View>

          <ChooseWordsCard
            onSelectAll={() => setSelected(results.map(r => itemKey(r.label, r.box.x1, r.box.y1)))}
            onDeselectAll={() => setSelected([])}
          />

          <Text className="mx-5 text-sm font-bold" tx="scan.detected_words_label" />

          <View className="gap-3 px-5">
            {results.map((item) => {
              const key = itemKey(item.label, item.box.x1, item.box.y1);
              return (
                <DetectedItemCard
                  key={key}
                  item={item}
                  selected={selected.includes(key)}
                  isDuplicate={labelCounts[item.label] > 1}
                  onToggle={() => toggle(key)}
                />
              );
            })}
          </View>
        </ScrollView>

        <ScanResultsActions canContinue={selected.length > 0} onRetake={retake} />
      </SafeAreaView>
    </View>
  );
}

import * as React from 'react';

import { FocusAwareStatusBar, SafeAreaView, View } from '@/components/ui';
import { AccuracyIcon, FlameIcon, FlashcardIcon } from '@/components/ui/icons';

import { LevelCard } from './components/level-card';
import { MetricCard } from './components/metric-card';

export function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-neutral-200 dark:bg-neutral-900">
      <FocusAwareStatusBar />
      <View>
        <LevelCard level={12} maxXP={5140} currentXP={4820} barColor="white" />
      </View>

      <View className="flex-row justify-between px-5">
        <MetricCard icon={() => <FlameIcon width={32} height={32} />} value="23" label="STREAK" />
        <MetricCard icon={() => <FlashcardIcon />} value="482" label="WORDS" />
        <MetricCard icon={() => <AccuracyIcon />} value="92%" label="ACCURACY" />
      </View>

    </SafeAreaView>
  );
}

import { Link } from 'expo-router';

import * as React from 'react';
import { FocusAwareStatusBar, MissionCard, SafeAreaView, Text, View } from '@/components/ui';

import { AccuracyIcon, FlameIcon, FlashcardIcon, MissionFlashcardIcon } from '@/components/ui/icons';
import { LevelCard } from './components/level-card';
import { MetricCard } from './components/metric-card';

export function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-neutral-200 dark:bg-neutral-900">
      <FocusAwareStatusBar />
      <View>
        <LevelCard level={12} maxXP={5140} currentXP={4820} barColor="white" trackColor="#7DD3FC" />
      </View>

      <View className="mt-5 flex-row justify-between px-5">
        <MetricCard icon={() => <FlameIcon width={32} height={32} />} value="23" label="STREAK" />
        <MetricCard icon={() => <FlashcardIcon />} value="482" label="WORDS" />
        <MetricCard icon={() => <AccuracyIcon />} value="92%" label="ACCURACY" />
      </View>

      <View className="mt-5 flex-row justify-between px-5">
        <Text className="text-[22px] font-bold text-black">Daily mission</Text>
        <Link href="/">
          <Text className="text-[13px] font-bold text-[#3525CD]">SEE ALL</Text>
        </Link>
      </View>

      <View className="mt-3">
        <MissionCard
          icon={() => <MissionFlashcardIcon />}
          label="Review 10 flashcards"
          currentProgress={7}
          totalProgress={10}
          trackColor="#E2E8F0"
          barColor="#FB923C"
          xpReward={20}
        />
      </View>

    </SafeAreaView>
  );
}

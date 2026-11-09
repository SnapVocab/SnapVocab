import * as React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Text } from '@/components/ui';
import { translate } from '@/lib/i18n';

/** Thin status line used for stale data and for badges waiting to be recorded. */
export function StatusBanner({ tone }: { tone: 'stale' | 'recording' }) {
  const recording = tone === 'recording';
  return (
    <View
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
      className={`mb-3.5 min-h-10 flex-row items-center gap-2 rounded-xl px-3 py-2 ${recording ? 'bg-[#FFF6DB] dark:bg-[#3A2E0A]' : 'bg-neutral-100 dark:bg-neutral-800'}`}
    >
      {recording && <ActivityIndicator size="small" color="#A87400" />}
      <Text className={`flex-1 font-inter text-[14px]/5 ${recording ? 'text-[#7A5200] dark:text-reward-300' : 'text-neutral-600 dark:text-neutral-300'}`}>
        {translate(recording ? 'badges.recording_banner' : 'badges.stale_banner')}
      </Text>
    </View>
  );
}

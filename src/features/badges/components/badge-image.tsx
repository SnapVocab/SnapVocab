import type { BadgeItem } from '../types';
import * as React from 'react';
import { Image, View } from 'react-native';
import { AchievementArtifact } from '@/components/snapvocab';
import { LockIcon } from '@/components/ui/icons';

/** Illustrated art per catalog `code`; codes added later fall back to the drawn medal. */
const ART: Record<string, number> = {
  STREAK_7: require('../../../assets/images/badges/streak_7.png'),
  STREAK_30: require('../../../assets/images/badges/streak_30.png'),
  STREAK_100: require('../../../assets/images/badges/streak_100.png'),
  QUIZ_1: require('../../../assets/images/badges/quiz_1.png'),
  QUIZ_10: require('../../../assets/images/badges/quiz_10.png'),
  QUIZ_50: require('../../../assets/images/badges/quiz_50.png'),
  PERFECT_1: require('../../../assets/images/badges/perfect_1.png'),
  PERFECT_10: require('../../../assets/images/badges/perfect_10.png'),
  PERFECT_50: require('../../../assets/images/badges/perfect_50.png'),
  WORDS_10: require('../../../assets/images/badges/words_10.png'),
  WORDS_100: require('../../../assets/images/badges/words_100.png'),
  WORDS_500: require('../../../assets/images/badges/words_500.png'),
};

/** Badge art at `size`; not-yet-earned badges are dimmed under a padlock. */
export function BadgeImage({ item, size }: { item: BadgeItem; size: number }) {
  const art = ART[item.code];
  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      {art
        ? <Image source={art} resizeMode="contain" style={{ width: size, height: size, opacity: item.earned ? 1 : 0.35 }} />
        : <AchievementArtifact metric={item.metric} iconKey={item.iconKey} state={item.earned ? 'earned' : 'locked'} size={size * 0.9} />}
      {!item.earned && (
        <View pointerEvents="none" className="absolute size-9 items-center justify-center rounded-full border border-white/50 bg-black/60">
          <LockIcon width={16} height={16} color="#FFFFFF" />
        </View>
      )}
    </View>
  );
}

export function ProgressBar({ percent, className }: { percent: number; className: string }) {
  return (
    <View className={`w-full overflow-hidden rounded-full border border-neutral-200/60 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 ${className}`}>
      <View className="h-full rounded-full bg-primary-500" style={{ width: `${Math.min(100, percent)}%` }} />
    </View>
  );
}

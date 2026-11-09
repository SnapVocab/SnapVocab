import type { BadgesView } from '../types';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { recentEarned } from '../model';
import { BadgeImage } from './badge-image';

/** Three latest badges inside the identity card (badges.md §2.4); hidden until the first badge. A medal opens its sheet, the rest opens the collection. */
export function ProfileBadgeStrip({ view, onPress }: { view: BadgesView | undefined; onPress: (badgeId?: number) => void }) {
  const recent = view ? recentEarned(view) : [];
  if (recent.length === 0)
    return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={translate('badges.profile.strip_a11y')}
      onPress={() => onPress()}
      className="mt-3 min-h-14 w-full flex-row items-center gap-2.5 border-t border-neutral-100 pt-3 active:opacity-70 dark:border-neutral-800"
    >
      {recent.map(item => (
        <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={item.name} hitSlop={4} onPress={() => onPress(item.id)} className="active:opacity-70">
          <BadgeImage item={item} size={40} />
        </Pressable>
      ))}
      <View className="flex-1" />
      <Text className="font-nunito text-[14px] font-extrabold text-primary-800 dark:text-primary-300">{translate('badges.profile.see_all')}</Text>
    </Pressable>
  );
}

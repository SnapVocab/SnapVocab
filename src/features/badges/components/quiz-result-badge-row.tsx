import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { useBadges } from '../api';
import { buildSeries, inDisplayOrder, unseenIds } from '../model';
import { useBadgeSessionStore } from '../use-badge-session-store';
import { BadgeImage } from './badge-image';

/**
 * Continuation row on Quiz Result (UI-BDG-01): no modal over the result's own celebration. A tap opens the modal at
 * reduced intensity; otherwise the host shows it at the first eligible route after this screen.
 */
export function QuizResultBadgeRow() {
  const { data } = useBadges();
  const shownIds = useBadgeSessionStore(s => s.shownIds);
  const requestUnlock = useBadgeSessionStore(s => s.requestUnlock);
  if (!data)
    return null;
  const items = inDisplayOrder(buildSeries(data), unseenIds(data).filter(id => !shownIds.includes(id)));
  const first = items[0];
  if (!first)
    return null;
  const title = items.length === 1 ? translate('badges.quiz_row.one', { name: first.name }) : translate('badges.quiz_row.many', { count: items.length });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={() => requestUnlock(items.map(i => i.id), 'reduced')}
      className="mt-3 w-full flex-row items-center gap-2.5 rounded-2xl border-[1.5px] border-b-[3px] border-neutral-200 bg-white px-3 py-2.5 active:opacity-80"
    >
      <BadgeImage item={first} size={40} />
      <View className="flex-1">
        <Text className="font-nunito text-[15px] font-extrabold text-mascot-navy">{title}</Text>
        <Text className="font-inter text-[14px] text-neutral-500">{translate('badges.quiz_row.hint')}</Text>
      </View>
      <Text className="font-nunito text-[14px] font-extrabold text-primary-800">{translate('badges.quiz_row.view')}</Text>
    </Pressable>
  );
}

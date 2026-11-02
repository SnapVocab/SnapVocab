import type { Meaning } from '../types';
import * as React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import { translate } from '@/lib/i18n/utils';

export type WordMeaningsProps = {
  meanings?: Meaning[];
};

export function WordMeanings({ meanings }: WordMeaningsProps) {
  const groupedMeanings = React.useMemo(() => {
    if (!meanings || meanings.length === 0) {
      return [] as { pos: string; items: Meaning[] }[];
    }

    const groups: Record<string, Meaning[]> = {};
    meanings.forEach((m) => {
      const posKey = (m.pos || 'OTHER').toUpperCase();
      if (!groups[posKey]) {
        groups[posKey] = [];
      }
      groups[posKey].push(m);
    });

    return Object.entries(groups).map(([pos, items]) => ({
      pos,
      items,
    }));
  }, [meanings]);

  if (groupedMeanings.length === 0) {
    return null;
  }

  return (
    <View className="mb-6">
      <Text className="mb-3 font-nunito text-base font-black text-mascot-navy dark:text-white">
        {translate('word_detail.meanings')}
      </Text>

      {groupedMeanings.map(group => (
        <View
          key={group.pos}
          className="mb-3.5 rounded-3xl border border-line bg-white p-4 shadow-xs dark:bg-neutral-800"
        >
          {/* Part of speech badge */}
          <View className="mb-3.5 items-center justify-center self-start rounded-lg bg-lime-100 px-3 py-1.5 dark:bg-lime-950/50">
            <Text className="font-nunito text-xs/normal font-black tracking-wider text-lime-700 uppercase dark:text-lime-400">
              {group.pos}
            </Text>
          </View>

          {/* Definitions list */}
          <View className="gap-3">
            {group.items.map((item, idx) => (
              <View key={`${group.pos}-${item.definition}-${idx}`} className="flex-row items-start">
                <View className="mt-0.5 size-5 items-center justify-center rounded-full bg-neutral-200/90 dark:bg-neutral-700">
                  <Text className="font-inter text-[11px] font-bold text-neutral-600 dark:text-neutral-300">
                    {idx + 1}
                  </Text>
                </View>
                <Text className="ml-2.5 flex-1 font-inter text-sm/relaxed font-semibold text-slate-800 dark:text-neutral-100">
                  {item.definition}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

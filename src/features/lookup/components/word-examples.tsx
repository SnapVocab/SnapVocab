import type { Meaning } from '../types';
import * as React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import { translate } from '@/lib/i18n/utils';

export type WordExamplesProps = {
  meanings?: Meaning[];
};

export function WordExamples({ meanings }: WordExamplesProps) {
  const examples = React.useMemo(() => {
    if (!meanings)
      return [];
    return meanings.filter(m => Boolean(m.example));
  }, [meanings]);

  if (examples.length === 0) {
    return null;
  }

  return (
    <View className="mb-6">
      <Text className="mb-3 font-nunito text-base font-black text-mascot-navy dark:text-white">
        {translate('word_detail.examples')}
      </Text>

      {examples.map((item, idx) => (
        <View
          key={`example-${idx}-${item.example?.slice(0, 10)}`}
          className="mb-3 rounded-3xl border border-neutral-200/90 bg-slate-50/90 p-4 dark:border-neutral-700 dark:bg-neutral-800/80"
        >
          <Text className="font-inter text-sm font-bold text-slate-900 dark:text-white">
            {`"${item.example}"`}
          </Text>
          {item.definition && (
            <Text className="mt-1.5 font-inter text-xs font-medium text-neutral-500 dark:text-neutral-400">
              {item.definition}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

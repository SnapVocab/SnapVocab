import type { PronunciationLookup } from '../types';
import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui';
import { VolumeIcon } from '@/components/ui/icons';
import { useTts } from '@/lib/hooks';

import { translate } from '@/lib/i18n/utils';

export type WordHeaderProps = {
  word: string;
  ipa?: string;
  pronunciations?: PronunciationLookup[];
};

export function WordHeader({ word, ipa, pronunciations }: WordHeaderProps) {
  const { speak, isPlaying } = useTts({ lang: 'en' });
  const displayIpa = ipa ?? pronunciations?.[0]?.ipa;

  return (
    <View className="mb-6">
      <Text className="font-nunito text-4xl font-black text-mascot-navy dark:text-white">
        {word}
      </Text>

      <View className="mt-2.5 flex-row items-center gap-3">
        {displayIpa && (
          <Text className="font-inter text-base font-medium text-neutral-500 dark:text-neutral-400">
            {displayIpa}
          </Text>
        )}

        {/* Pronounce Button */}
        <TouchableOpacity
          onPress={() => speak(word, { lang: 'en' })}
          activeOpacity={0.7}
          className={`flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 active:bg-sky-100 dark:bg-sky-950/40 ${
            isPlaying
              ? 'border-sky-400 bg-sky-100 dark:border-sky-600'
              : 'border-sky-200/80 bg-sky-50 dark:border-sky-800'
          }`}
        >
          <VolumeIcon color="#0284C7" width={16} height={16} />
          <Text className="font-inter text-xs font-bold text-sky-600 dark:text-sky-400">
            {translate('word_detail.pronounce')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

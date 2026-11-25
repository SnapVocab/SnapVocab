import * as React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Button, Mascot, Text } from '@/components/ui';
import { RotateCcwIcon, SparklesIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';

type Props = {
  words?: string[];
  topicName?: string;
  error?: string | null;
  onRetry: () => void;
  onCancel: () => void;
};

export function StoryGeneratingView({
  words = [],
  topicName,
  error,
  onRetry,
  onCancel,
}: Props) {
  if (error) {
    return (
      <View className="my-8 items-center rounded-3xl border-2 border-b-4 border-line border-b-edge bg-surface px-6 py-8">
        <Mascot pose="sad" className="mb-4 size-28" />
        <Text className="text-center font-nunito text-xl font-black text-mascot-navy dark:text-white">
          {translate('story.generate_failed_title')}
        </Text>
        <Text className="mt-1.5 mb-6 text-center font-inter text-sm/5 text-neutral-500 dark:text-neutral-300">
          {error}
        </Text>
        <View className="w-full gap-2.5">
          <Button
            label={translate('word_detail.retry')}
            icon={<RotateCcwIcon width={16} height={16} color="#FFFFFF" />}
            onPress={onRetry}
          />
          <Button
            variant="white"
            label={translate('my_words.cancel')}
            onPress={onCancel}
          />
        </View>
      </View>
    );
  }

  return (
    <View className="my-6 items-center rounded-3xl border-2 border-b-4 border-amber-200 border-b-amber-300 bg-amber-50/70 px-6 py-9 dark:border-amber-500/30 dark:border-b-amber-500/50 dark:bg-amber-500/10">
      <Mascot pose="read" className="mb-4 size-28" />

      <View className="mb-2 flex-row items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 dark:bg-amber-500/20">
        <SparklesIcon width={14} height={14} color="#D97706" />
        <Text className="font-nunito text-xs font-black tracking-wide text-amber-800 uppercase dark:text-amber-300">
          {translate('story.weaving_badge')}
        </Text>
      </View>

      <Text className="mt-1 text-center font-nunito text-xl font-black text-mascot-navy dark:text-white">
        {topicName
          ? translate('story.weaving_topic_title', { topic: topicName })
          : translate('story.weaving_words_title')}
      </Text>

      <Text className="mt-1.5 text-center font-inter text-sm/5 text-neutral-600 dark:text-neutral-300">
        {translate('story.weaving_subtitle')}
      </Text>

      {words.length > 0 && (
        <View className="mt-5 flex-row flex-wrap justify-center gap-2">
          {words.slice(0, 10).map(word => (
            <View
              key={word}
              className="rounded-xl border border-amber-300/80 bg-white px-3 py-1.5 dark:border-amber-500/40 dark:bg-neutral-900"
            >
              <Text className="font-nunito text-xs font-black text-amber-800 dark:text-amber-300">
                {word}
              </Text>
            </View>
          ))}
          {words.length > 10 && (
            <View className="rounded-xl border border-amber-300/80 bg-white px-2.5 py-1.5 dark:border-amber-500/40 dark:bg-neutral-900">
              <Text className="font-nunito text-xs font-extrabold text-neutral-500 dark:text-neutral-300">
                {`+${words.length - 10}`}
              </Text>
            </View>
          )}
        </View>
      )}

      <ActivityIndicator size="small" color="#D97706" className="mt-6" />
    </View>
  );
}

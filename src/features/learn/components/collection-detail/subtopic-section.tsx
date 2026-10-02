import type { TopicDTO } from '../../types';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/ui';
import { ChevronRightIcon, FolderIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';

type Props = {
  subtopics: TopicDTO[];
  onSelectTopic: (topic: TopicDTO) => void;
};

export function SubtopicSection({ subtopics, onSelectTopic }: Props) {
  if (subtopics.length === 0) {
    return null;
  }

  return (
    <View className="mb-4">
      {/* Section Header */}
      <View className="mb-2.5 flex-row items-center">
        <View className="flex-row items-center gap-1.5">
          <FolderIcon width={16} height={16} color="#D97706" />
          <Text className="font-nunito text-sm font-black text-mascot-navy dark:text-white">
            {translate('learn.topic.subtopics_title', { defaultValue: 'Chủ đề con' })}
            {' '}
            (
            {subtopics.length}
            )
          </Text>
        </View>
      </View>

      {/* Horizontal Subtopics Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2.5 pr-4"
      >
        {subtopics.map(topic => (
          <Pressable
            key={String(topic.id)}
            onPress={() => onSelectTopic(topic)}
            android_ripple={{ color: 'transparent' }}
            className="w-44 justify-between rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3 shadow-xs active:opacity-75 dark:border-neutral-700 dark:bg-neutral-800/80"
          >
            <View>
              <View className="flex-row items-center justify-between">
                <View className="size-7 items-center justify-center rounded-xl bg-amber-100 dark:bg-neutral-700">
                  <FolderIcon width={14} height={14} color="#D97706" />
                </View>
                {topic.hasChildren && (
                  <View className="rounded-md bg-amber-200/60 px-1.5 py-0.5 dark:bg-neutral-700">
                    <Text className="font-inter text-[10px] font-bold text-amber-900 dark:text-amber-300">
                      +
                    </Text>
                  </View>
                )}
              </View>

              <Text
                numberOfLines={1}
                className="mt-2 font-nunito text-sm font-black text-mascot-navy dark:text-white"
              >
                {topic.name}
              </Text>

              {topic.translation ? (
                <Text
                  numberOfLines={1}
                  className="mt-0.5 font-inter text-xs text-neutral-500 dark:text-neutral-400"
                >
                  {topic.translation}
                </Text>
              ) : null}
            </View>

            <View className="mt-2 flex-row items-center justify-between border-t border-amber-100/80 pt-1.5 dark:border-neutral-700">
              <Text className="font-inter text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                Mở chủ đề
              </Text>
              <ChevronRightIcon width={12} height={12} color="#D97706" />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export default SubtopicSection;

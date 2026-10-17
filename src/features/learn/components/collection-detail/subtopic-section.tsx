import type { TopicDTO } from '../../types';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/ui';
import { ChevronRightIcon, FolderIcon, PlayIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';

type Props = {
  subtopics: TopicDTO[];
  onSelectTopic: (topic: TopicDTO) => void;
  onStudyTopic: (topic: TopicDTO) => void;
};

export function SubtopicSection({ subtopics, onSelectTopic, onStudyTopic }: Props) {
  if (subtopics.length === 0) {
    return null;
  }

  return (
    <View className="mb-4">
      {/* Section Header */}
      <View className="mb-2.5 flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <View className="size-6 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/60">
            <FolderIcon width={14} height={14} color="#D97706" />
          </View>
          <Text className="font-nunito text-xs font-black tracking-wider text-amber-900 uppercase dark:text-amber-300">
            {translate('learn.topic.subtopics_title')}
          </Text>
        </View>

        <View className="rounded-full bg-amber-100 px-2 py-0.5 dark:bg-amber-950/60">
          <Text className="font-nunito text-[11px] font-black text-amber-800 dark:text-amber-300">
            {subtopics.length}
          </Text>
        </View>
      </View>

      {/* Horizontal Subtopics Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-3 pr-4"
      >
        {subtopics.map(topic => (
          <View
            key={String(topic.id)}
            className="w-48 justify-between rounded-2xl border-2 border-b-4 border-amber-300/90 border-b-amber-400 bg-amber-50/80 p-3.5 dark:border-amber-800 dark:border-b-amber-900 dark:bg-amber-950/40"
          >
            <Pressable onPress={() => onSelectTopic(topic)} className="active:opacity-70">
              <View className="flex-row items-center justify-between">
                <View className="size-8 items-center justify-center rounded-xl border-2 border-b-[3px] border-amber-300 border-b-amber-400 bg-white dark:border-amber-700 dark:border-b-amber-800 dark:bg-neutral-800">
                  <FolderIcon width={16} height={16} color="#D97706" />
                </View>
                {topic.hasChildren && (
                  <View className="rounded-full border border-amber-300/80 bg-amber-200/70 px-2 py-0.5 dark:border-amber-700 dark:bg-amber-900/60">
                    <Text className="font-nunito text-[10px] font-black text-amber-900 dark:text-amber-200">
                      +
                    </Text>
                  </View>
                )}
              </View>

              <Text
                numberOfLines={1}
                className="mt-2.5 font-nunito text-[15px] font-black text-mascot-navy dark:text-white"
              >
                {topic.name}
              </Text>

              {topic.translation ? (
                <Text
                  numberOfLines={1}
                  className="mt-0.5 font-inter text-xs font-medium text-neutral-500 dark:text-neutral-400"
                >
                  {topic.translation}
                </Text>
              ) : null}
            </Pressable>

            <View className="mt-3 flex-row gap-2">
              <Pressable
                onPress={() => onSelectTopic(topic)}
                className="flex-1 flex-row items-center justify-center gap-1 rounded-xl border border-amber-200/90 bg-white/90 p-2 dark:border-neutral-700 dark:bg-neutral-800"
              >
                <Text className="font-nunito text-[11px] font-extrabold text-amber-800 dark:text-amber-300">
                  {translate('learn.topic.open_topic')}
                </Text>
                <ChevronRightIcon width={12} height={12} color="#D97706" />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={translate('learn.topic.study_topic', { name: topic.name })}
                onPress={() => onStudyTopic(topic)}
                className="size-9 items-center justify-center rounded-xl border-2 border-b-[3px] border-emerald-200 border-b-emerald-300 bg-emerald-50 active:translate-y-px dark:border-emerald-800 dark:border-b-emerald-900 dark:bg-emerald-950/50"
              >
                <PlayIcon width={13} height={13} fill="#16A34A" />
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export default SubtopicSection;

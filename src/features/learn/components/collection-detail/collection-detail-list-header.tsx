import type { TopicDTO } from '../../types';
import type { StudyCounts } from '@/features/study/api';
import * as React from 'react';
import { TextInput, View } from 'react-native';
import { Button, Pressable, Text } from '@/components/ui';
import { ChevronRightIcon, CloseIcon, SearchIcon, SparklesIcon } from '@/components/ui/icons';
import { StudyCountLabels } from '@/features/study/study-count-labels';
import { translate } from '@/lib/i18n';
import SubtopicSection from './subtopic-section';

type Props = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isInsideTopic: boolean;
  subtopics: TopicDTO[];
  totalCount: number;
  onSelectTopic: (topic: TopicDTO) => void;
  onStudyTopic: (topic: TopicDTO) => void;
  onStudyCollection: () => void;
  onStoryTopic?: () => void;
  counts?: StudyCounts;
  topicCounts?: StudyCounts[];
  countsError?: boolean;
  onRetryCounts?: () => void;
};

export function CollectionDetailListHeader({
  searchQuery,
  onSearchChange,
  isInsideTopic,
  subtopics,
  totalCount,
  onSelectTopic,
  onStudyTopic,
  onStudyCollection,
  onStoryTopic,
  counts,
  topicCounts,
  countsError,
  onRetryCounts,
}: Props) {
  return (
    <View className="mb-3">
      <Text className="mb-2 font-nunito text-base font-extrabold text-mascot-navy dark:text-white" tx="study_limits.today" />
      <StudyCountLabels counts={counts} className="mb-3" />
      {countsError && (
        <View className="mb-3 gap-2">
          <Text className="text-sm text-danger-600 dark:text-danger-400" tx="study_limits.counts_error" />
          <Button variant="white" tx="study_limits.retry" onPress={onRetryCounts} />
        </View>
      )}
      <Button
        className="mb-3"
        variant="primary"
        label={translate('study_limits.start')}
        onPress={onStudyCollection}
        disabled={!counts || counts.newCount + counts.dueCount === 0}
        testID="study-collection"
      />
      {isInsideTopic && totalCount >= 3 && onStoryTopic && (
        <Pressable
          onPress={onStoryTopic}
          className="mb-3 flex-row items-center justify-between rounded-2xl border-2 border-b-4 border-amber-300 border-b-amber-400 bg-amber-50 px-4 py-3 active:translate-y-px dark:border-amber-500/40 dark:border-b-amber-600/50 dark:bg-amber-500/15"
        >
          <View className="flex-1 flex-row items-center gap-2.5 pr-2">
            <SparklesIcon width={18} height={18} color="#D97706" />
            <View className="flex-1">
              <Text className="font-nunito text-sm font-black text-amber-900 dark:text-amber-200">
                {translate('story.topic_1tap_title')}
              </Text>
              <Text className="font-inter text-xs text-amber-800/80 dark:text-amber-200/80" numberOfLines={1}>
                {translate('story.topic_1tap_subtitle')}
              </Text>
            </View>
          </View>
          <ChevronRightIcon width={18} height={18} color="#B45309" />
        </Pressable>
      )}
      {/* Search Box */}
      <View className="mb-3 flex-row items-center rounded-2xl border border-line bg-surface px-3.5 py-2.5">
        <SearchIcon width={18} height={18} color="#9CA3AF" />
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder={
            isInsideTopic
              ? translate('learn.topic.search_words_placeholder', {
                  defaultValue: 'Tìm từ vựng trong chủ đề...',
                })
              : translate('learn.collection_detail.search_placeholder')
          }
          placeholderTextColor="#9CA3AF"
          className="ml-2.5 flex-1 font-inter text-sm text-neutral-800 dark:text-white"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => onSearchChange('')} hitSlop={8}>
            <CloseIcon width={16} height={16} color="#9CA3AF" />
          </Pressable>
        )}
      </View>

      {/* Subtopics Section (when inside a topic) */}
      {isInsideTopic && (
        <SubtopicSection
          subtopics={subtopics}
          onSelectTopic={onSelectTopic}
          onStudyTopic={onStudyTopic}
          studyCounts={topicCounts}
        />
      )}

      {/* Section Title & Total Counter */}
      <View className="flex-row items-center justify-between">
        <Text className="font-nunito text-base font-black text-mascot-navy dark:text-white">
          {isInsideTopic
            ? translate('learn.topic.words_list_title', {
                defaultValue: 'Từ vựng trong chủ đề',
              })
            : translate('learn.collection_detail.topics_list_title')}
          {' '}
          (
          {totalCount}
          )
        </Text>
      </View>
    </View>
  );
}

export default CollectionDetailListHeader;

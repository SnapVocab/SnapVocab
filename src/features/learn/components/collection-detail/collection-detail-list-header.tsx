import type { TopicDTO } from '../../types';
import type { StudyCounts } from '@/features/study/api';
import * as React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Button, Text } from '@/components/ui';
import { CloseIcon, SearchIcon } from '@/components/ui/icons';
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

import type { TopicDTO } from '../../types';
import * as React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Button, Text } from '@/components/ui';
import { CloseIcon, SearchIcon } from '@/components/ui/icons';
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
  collectionDueCount: number;
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
  collectionDueCount,
}: Props) {
  return (
    <View className="mb-3">
      {!isInsideTopic && (
        <Button
          className="mb-3"
          variant="primary"
          label={collectionDueCount > 0
            ? translate('learn.library.study_due', { count: collectionDueCount })
            : translate('learn.library.study_collection')}
          onPress={onStudyCollection}
          testID="study-collection"
        />
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

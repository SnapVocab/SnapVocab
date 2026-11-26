import type { BottomSheetBackdropProps, BottomSheetModal } from '@gorhom/bottom-sheet';
import type { QuizAvailableTopic } from '../api/quiz-api';
import { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSurface } from '@/components/ui';
import { AppBottomSheetModal } from '@/components/ui/app-bottom-sheet-modal';
import {
  CheckCircleIcon,
  CloseIcon,
  SearchIcon,
} from '@/components/ui/icons';
import { translate } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type Props = {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  selectedTopicId?: number;
  topics: QuizAvailableTopic[];
  isLoading?: boolean;
  onSelectTopic: (topic: QuizAvailableTopic) => void;
};

export function TopicSelectBottomSheet({
  bottomSheetRef,
  selectedTopicId,
  topics,
  isLoading,
  onSelectTopic,
}: Props) {
  const insets = useSafeAreaInsets();
  const surface = useSurface();
  const [searchQuery, setSearchQuery] = useState('');

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  const handleClose = () => {
    bottomSheetRef.current?.dismiss();
  };

  const handleSelect = (topic: QuizAvailableTopic) => {
    onSelectTopic(topic);
    handleClose();
  };

  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) {
      return topics;
    }
    const q = searchQuery.toLowerCase().trim();
    return topics.filter(
      t =>
        t.name.toLowerCase().includes(q)
        || (t.translation && t.translation.toLowerCase().includes(q))
        || (t.collectionName && t.collectionName.toLowerCase().includes(q)),
    );
  }, [topics, searchQuery]);

  return (
    <AppBottomSheetModal
      ref={bottomSheetRef}
      snapPoints={['60%', '88%']}
      enableDynamicSizing={false}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: surface.border, width: 36, height: 4 }}
      backgroundStyle={{
        backgroundColor: surface.surface,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
      }}
    >
      <View style={{ flex: 1, backgroundColor: surface.surface }}>
        <View
          className="border-b px-5 pt-1 pb-3"
          style={{ borderBottomColor: surface.border }}
        >
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-nunito text-[18px] font-extrabold text-mascot-navy dark:text-white">
                {translate('quiz.topic')}
              </Text>
              <Text className="font-inter text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
                {translate('quiz.topic_hint')}
              </Text>
            </View>
            <Pressable
              onPress={handleClose}
              hitSlop={8}
              className="size-9 items-center justify-center rounded-full bg-neutral-100 active:bg-pressed dark:bg-neutral-800"
            >
              <CloseIcon size={16} className="text-neutral-500 dark:text-neutral-300" />
            </Pressable>
          </View>

          {/* Search bar */}
          <View className="mt-3.5 flex-row items-center rounded-xl border border-line bg-neutral-50 px-3 py-2 dark:bg-neutral-800">
            <SearchIcon size={18} className="text-neutral-400 dark:text-neutral-300" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={translate('quiz.search_topic_placeholder')}
              placeholderTextColor={surface.textMuted}
              className="ml-2 flex-1 p-0 font-inter text-[13.5px] text-neutral-800 dark:text-white"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                <CloseIcon size={14} className="text-neutral-400 dark:text-neutral-300" />
              </Pressable>
            )}
          </View>
        </View>

        <BottomSheetScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: Math.max(insets.bottom, 24) + 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View className="items-center justify-center py-12">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="mt-3 font-inter text-[13px] font-medium text-neutral-500 dark:text-neutral-400">
                {translate('quiz.topics_loading')}
              </Text>
            </View>
          ) : filteredTopics.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Text className="text-[32px]">📚</Text>
              <Text className="mt-2 text-center font-nunito text-[16px] font-extrabold text-mascot-navy dark:text-white">
                {searchQuery.trim()
                  ? translate('quiz.no_topic_match')
                  : translate('quiz.no_topics')}
              </Text>
              <Text className="mt-1 px-4 text-center font-inter text-[12.5px] font-medium text-neutral-500 dark:text-neutral-400">
                {searchQuery.trim()
                  ? translate('quiz.try_another_search')
                  : translate('quiz.no_topics_hint')}
              </Text>
            </View>
          ) : (
            <View className="gap-2.5">
              {filteredTopics.map((topic) => {
                const isSelected = topic.id === selectedTopicId;
                return (
                  <Pressable
                    key={topic.id}
                    onPress={() => handleSelect(topic)}
                    className={cn(
                      'flex-row items-center justify-between rounded-2xl border-2 p-3.5 transition-all active:scale-[0.99]',
                      isSelected
                        ? 'border-primary-500 bg-primary-50/70 dark:border-primary-700 dark:bg-primary-500/15'
                        : 'border-line bg-surface active:bg-pressed',
                    )}
                  >
                    <View className="flex-1 flex-row items-center gap-3 pr-2">
                      <View
                        className={cn(
                          'size-10 items-center justify-center rounded-xl border',
                          isSelected
                            ? 'border-primary-200 bg-surface dark:border-primary-800'
                            : 'border-line bg-neutral-50 dark:bg-neutral-800',
                        )}
                      >
                        <Text className="text-[20px]">🎯</Text>
                      </View>
                      <View className="flex-1">
                        <Text
                          className={cn(
                            'mb-0.5 font-nunito text-[15px] font-extrabold',
                            isSelected ? 'text-primary-800 dark:text-primary-200' : 'text-mascot-navy dark:text-white',
                          )}
                          numberOfLines={1}
                        >
                          {topic.name}
                        </Text>
                        <View className="flex-row items-center gap-1.5">
                          <View className="max-w-[130px] rounded-md bg-neutral-100 px-1.5 py-0.5 dark:bg-neutral-800">
                            <Text
                              className="font-inter text-[10.5px] font-medium text-neutral-500 dark:text-neutral-300"
                              numberOfLines={1}
                            >
                              {topic.collectionName}
                            </Text>
                          </View>
                          {topic.translation && (
                            <Text
                              className="font-inter text-[11.5px] font-medium text-neutral-400 dark:text-neutral-400"
                              numberOfLines={1}
                            >
                              ·
                              {' '}
                              {topic.translation}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>

                    <View className="size-6 shrink-0 items-center justify-center">
                      {isSelected ? (
                        <View className="size-6 items-center justify-center rounded-full bg-primary-500">
                          <CheckCircleIcon size={14} className="text-white" />
                        </View>
                      ) : (
                        <View className="size-5 rounded-full border-2 border-edge" />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </BottomSheetScrollView>
      </View>
    </AppBottomSheetModal>
  );
}

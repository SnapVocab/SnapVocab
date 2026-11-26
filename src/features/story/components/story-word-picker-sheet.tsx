import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import type { StoryTopicWordItem } from '../types';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import * as React from 'react';
import { ActivityIndicator, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Pressable, showErrorMessage, Text, useSurface } from '@/components/ui';
import {
  CheckIcon,
  ChevronRightIcon,
  CloseIcon,
  FolderIcon,
  RepeatIcon,
  SearchIcon,
} from '@/components/ui/icons';
import { translate } from '@/lib/i18n';
import {
  DEFAULT_SMART_PICK_COUNT,
  MAX_STORY_WORDS,
  MIN_STORY_WORDS,
  pickRandomFromPool,
} from '../utils';

export type StoryWordPickerTab = 'TOPIC' | 'MY_WORDS';

type Props = {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  activeTab: StoryWordPickerTab;
  onChangeTab: (tab: StoryWordPickerTab) => void;
  selectedTopic: { id: number; name: string; translation?: string | null } | null;
  topicWords: StoryTopicWordItem[];
  isLoadingTopicWords?: boolean;
  savedWords: string[];
  selectedWords: string[];
  onChangeWords: (words: string[]) => void;
  onRequestSwitchTopic: () => void;
};

function SelectableWordRow({
  word,
  translation,
  active,
  onPress,
}: {
  word: string;
  translation?: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: active }}
      className={`mb-2 min-h-12 flex-row items-center justify-between rounded-2xl border px-3.5 py-2.5 ${
        active
          ? 'border-primary-500 bg-primary-50/90 dark:border-primary-400 dark:bg-primary-500/15'
          : 'border-line bg-surface-raised active:bg-pressed'
      }`}
    >
      <View className="mr-3 flex-1">
        <Text
          className={`font-nunito text-[15px] font-black ${
            active ? 'text-primary-800 dark:text-primary-200' : 'text-mascot-navy dark:text-white'
          }`}
        >
          {word}
        </Text>
        {Boolean(translation) && (
          <Text
            className="mt-0.5 font-inter text-xs text-neutral-500 dark:text-neutral-300"
            numberOfLines={1}
          >
            {translation}
          </Text>
        )}
      </View>

      <View
        className={`size-6 items-center justify-center rounded-full border-2 ${
          active
            ? 'border-primary-600 bg-primary-500 dark:border-primary-400'
            : 'border-neutral-300 bg-transparent dark:border-neutral-600'
        }`}
      >
        {active && <CheckIcon width={13} height={13} color="#FFFFFF" />}
      </View>
    </Pressable>
  );
}

function SelectedWordsTray({
  selectedWords,
  onRemove,
  onClearAll,
  onPickRandom,
  canPickRandom,
}: {
  selectedWords: string[];
  onRemove: (word: string) => void;
  onClearAll: () => void;
  onPickRandom: () => void;
  canPickRandom: boolean;
}) {
  return (
    <View className="mb-4">
      <View className="mb-2 flex-row items-center justify-between gap-2">
        <Text className="font-nunito text-xs font-extrabold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
          {`${translate('story.selected_words_label')} (${selectedWords.length}/${MAX_STORY_WORDS})`}
        </Text>
        <View className="flex-row items-center gap-3">
          {canPickRandom && (
            <Pressable onPress={onPickRandom} hitSlop={8} className="flex-row items-center gap-1">
              <RepeatIcon width={12} height={12} color="#D97706" />
              <Text className="font-nunito text-xs font-extrabold text-amber-700 dark:text-amber-300">
                {translate('story.pick_random_n', { count: DEFAULT_SMART_PICK_COUNT })}
              </Text>
            </Pressable>
          )}
          {selectedWords.length > 0 && (
            <Pressable onPress={onClearAll} hitSlop={8}>
              <Text className="font-nunito text-xs font-extrabold text-danger-600 dark:text-danger-400">
                {translate('story.clear_all')}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {selectedWords.length === 0 ? (
        <View className="rounded-2xl border border-dashed border-line px-4 py-3">
          <Text className="text-center font-inter text-xs text-neutral-400">
            {translate('story.selected_empty_hint', { min: MIN_STORY_WORDS })}
          </Text>
        </View>
      ) : (
        <View className="flex-row flex-wrap gap-1.5">
          {selectedWords.map(w => (
            <Pressable
              key={w}
              onPress={() => onRemove(w)}
              className="min-h-8 flex-row items-center gap-1.5 rounded-xl border border-primary-500 bg-primary-50 px-2.5 py-1 dark:border-primary-400 dark:bg-primary-500/20"
            >
              <Text className="font-nunito text-xs font-black text-primary-800 dark:text-primary-200">
                {w}
              </Text>
              <CloseIcon width={11} height={11} color="#4E7A25" />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

export function StoryWordPickerSheet({
  bottomSheetRef,
  activeTab,
  onChangeTab,
  selectedTopic,
  topicWords,
  isLoadingTopicWords,
  savedWords,
  selectedWords,
  onChangeWords,
  onRequestSwitchTopic,
}: Props) {
  const insets = useSafeAreaInsets();
  const surface = useSurface();
  const [search, setSearch] = React.useState('');

  const renderBackdrop = React.useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    [],
  );

  const toggleWord = (word: string) => {
    const key = word.toLowerCase();
    const exists = selectedWords.some(w => w.toLowerCase() === key);
    if (exists) {
      onChangeWords(selectedWords.filter(w => w.toLowerCase() !== key));
      return;
    }
    if (selectedWords.length >= MAX_STORY_WORDS) {
      showErrorMessage(translate('story.max_words_error', { max: MAX_STORY_WORDS }));
      return;
    }
    onChangeWords([...selectedWords, word]);
  };

  const activePoolWords = React.useMemo(
    () => (activeTab === 'TOPIC' ? topicWords.map(t => t.word) : savedWords),
    [activeTab, savedWords, topicWords],
  );

  const handlePickRandom = () => {
    if (activePoolWords.length === 0)
      return;
    const picked = pickRandomFromPool(activePoolWords, DEFAULT_SMART_PICK_COUNT, selectedWords);
    onChangeWords(picked);
  };

  const filteredTopicWords = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q)
      return topicWords;
    return topicWords.filter(
      item =>
        item.word.toLowerCase().includes(q)
        || (item.translation && item.translation.toLowerCase().includes(q)),
    );
  }, [search, topicWords]);

  const filteredSavedWords = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q)
      return savedWords;
    return savedWords.filter(w => w.toLowerCase().includes(q));
  }, [savedWords, search]);

  const showSearch = activeTab === 'TOPIC' ? topicWords.length > 6 : savedWords.length > 6;

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={['76%', '92%']}
      enableDynamicSizing={false}
      stackBehavior="replace"
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: surface.border, width: 36, height: 4 }}
      backgroundStyle={{ backgroundColor: surface.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
    >
      <View style={{ flex: 1, backgroundColor: surface.surface }}>
        {/* Header + Source Tabs */}
        <View className="border-b border-line px-5 pt-1 pb-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="font-nunito text-lg font-black text-mascot-navy dark:text-white">
                {translate('story.word_sheet_title')}
              </Text>
              <Text className="font-inter text-xs text-neutral-500 dark:text-neutral-400">
                {translate('story.word_sheet_subtitle', {
                  count: selectedWords.length,
                  max: MAX_STORY_WORDS,
                  min: MIN_STORY_WORDS,
                })}
              </Text>
            </View>
            <Pressable
              onPress={() => bottomSheetRef.current?.dismiss()}
              className="size-9 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
            >
              <CloseIcon width={16} height={16} color={surface.textMuted} />
            </Pressable>
          </View>

          <View className="mt-3 flex-row gap-2 rounded-2xl bg-neutral-100 p-1 dark:bg-neutral-800">
            <Pressable
              onPress={() => onChangeTab('TOPIC')}
              className={`min-h-10 flex-1 items-center justify-center rounded-xl px-3 ${
                activeTab === 'TOPIC' ? 'bg-white shadow-xs dark:bg-neutral-700' : ''
              }`}
            >
              <Text
                className={`font-nunito text-xs font-black ${
                  activeTab === 'TOPIC'
                    ? 'text-mascot-navy dark:text-white'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                {translate('story.tab_system_topic')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onChangeTab('MY_WORDS')}
              className={`min-h-10 flex-1 items-center justify-center rounded-xl px-3 ${
                activeTab === 'MY_WORDS' ? 'bg-white shadow-xs dark:bg-neutral-700' : ''
              }`}
            >
              <Text
                className={`font-nunito text-xs font-black ${
                  activeTab === 'MY_WORDS'
                    ? 'text-mascot-navy dark:text-white'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                {translate('story.tab_my_words', { count: savedWords.length })}
              </Text>
            </Pressable>
          </View>

          {activeTab === 'TOPIC' && (
            <Pressable
              onPress={onRequestSwitchTopic}
              className="mt-2.5 min-h-11 flex-row items-center justify-between rounded-xl border border-amber-300/80 bg-amber-50/80 px-3.5 py-2 dark:border-amber-500/35 dark:bg-amber-500/10"
            >
              <View className="flex-1 flex-row items-center gap-2 pr-2">
                <FolderIcon width={16} height={16} color="#D97706" />
                <Text className="flex-1 font-nunito text-xs font-black text-mascot-navy dark:text-amber-100" numberOfLines={1}>
                  {selectedTopic
                    ? `${selectedTopic.name}${selectedTopic.translation ? ` (${selectedTopic.translation})` : ''}`
                    : translate('story.choose_system_topic')}
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Text className="font-nunito text-xs font-extrabold text-amber-800 dark:text-amber-300">
                  {translate('story.change_topic')}
                </Text>
                <ChevronRightIcon width={14} height={14} color="#B45309" />
              </View>
            </Pressable>
          )}

          {showSearch && (
            <View className="mt-2.5 flex-row items-center rounded-xl border border-line bg-neutral-50 px-3 py-2 dark:bg-neutral-800">
              <SearchIcon width={16} height={16} color={surface.textMuted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={translate('story.search_words_placeholder')}
                placeholderTextColor={surface.textMuted}
                className="ml-2 flex-1 p-0 font-inter text-xs text-neutral-800 dark:text-white"
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')} hitSlop={8}>
                  <CloseIcon width={14} height={14} color={surface.textMuted} />
                </Pressable>
              )}
            </View>
          )}
        </View>

        <BottomSheetScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: Math.max(insets.bottom, 20) + 76,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <SelectedWordsTray
            selectedWords={selectedWords}
            onRemove={toggleWord}
            onClearAll={() => onChangeWords([])}
            onPickRandom={handlePickRandom}
            canPickRandom={activePoolWords.length >= MIN_STORY_WORDS}
          />

          {activeTab === 'TOPIC' ? (
            !selectedTopic ? (
              <Pressable
                onPress={onRequestSwitchTopic}
                className="items-center rounded-2xl border-2 border-dashed border-amber-300 p-6 dark:border-amber-500/40"
              >
                <Text className="font-nunito text-sm font-black text-amber-800 dark:text-amber-200">
                  {translate('story.choose_system_topic')}
                </Text>
              </Pressable>
            ) : isLoadingTopicWords ? (
              <View className="items-center py-10">
                <ActivityIndicator color="#D97706" />
                <Text className="mt-2 font-inter text-xs text-neutral-500 dark:text-neutral-400">
                  {translate('story.topic_loading_words')}
                </Text>
              </View>
            ) : filteredTopicWords.length === 0 ? (
              <Text className="py-8 text-center font-inter text-xs text-neutral-400">
                {translate('story.no_matching_words')}
              </Text>
            ) : (
              filteredTopicWords.map((item) => {
                const active = selectedWords.some(s => s.toLowerCase() === item.word.toLowerCase());
                return (
                  <SelectableWordRow
                    key={item.itemId}
                    word={item.word}
                    translation={item.translation}
                    active={active}
                    onPress={() => toggleWord(item.word)}
                  />
                );
              })
            )
          ) : savedWords.length === 0 ? (
            <View className="rounded-2xl border border-dashed border-line p-5">
              <Text className="text-center font-inter text-xs/5 text-neutral-500 dark:text-neutral-400">
                {translate('story.empty_saved_words')}
              </Text>
            </View>
          ) : filteredSavedWords.length === 0 ? (
            <Text className="py-8 text-center font-inter text-xs text-neutral-400">
              {translate('story.no_matching_words')}
            </Text>
          ) : (
            filteredSavedWords.map((w) => {
              const active = selectedWords.some(s => s.toLowerCase() === w.toLowerCase());
              return (
                <SelectableWordRow
                  key={w}
                  word={w}
                  active={active}
                  onPress={() => toggleWord(w)}
                />
              );
            })
          )}
        </BottomSheetScrollView>

        <View
          style={{ paddingBottom: Math.max(insets.bottom, 12) + 8, backgroundColor: surface.surface }}
          className="border-t border-line px-5 pt-3"
        >
          <Button
            label={translate('story.done_picking', { count: selectedWords.length })}
            onPress={() => bottomSheetRef.current?.dismiss()}
          />
        </View>
      </View>
    </BottomSheetModal>
  );
}

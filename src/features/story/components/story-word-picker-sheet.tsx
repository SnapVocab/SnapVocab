import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import * as React from 'react';
import { TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Pressable, showErrorMessage, Text, useSurface } from '@/components/ui';
import { CheckIcon, CloseIcon, PlusIcon, SearchIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';
import { MAX_STORY_WORDS, WORD_TOKEN_REGEX } from '../utils';

type Props = {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  selectedWords: string[];
  savedWords: string[];
  onChangeWords: (words: string[]) => void;
};

export function StoryWordPickerSheet({
  bottomSheetRef,
  selectedWords,
  savedWords,
  onChangeWords,
}: Props) {
  const insets = useSafeAreaInsets();
  const surface = useSurface();
  const [customInput, setCustomInput] = React.useState('');
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

  const handleAddCustom = () => {
    const rawParts = customInput
      .split(/[,\n]+/)
      .map(s => s.trim())
      .filter(Boolean);
    if (rawParts.length === 0)
      return;

    const next = [...selectedWords];
    for (const part of rawParts) {
      if (!WORD_TOKEN_REGEX.test(part)) {
        showErrorMessage(translate('story.invalid_word_error'));
        continue;
      }
      if (next.length >= MAX_STORY_WORDS) {
        showErrorMessage(translate('story.max_words_error', { max: MAX_STORY_WORDS }));
        break;
      }
      if (!next.some(w => w.toLowerCase() === part.toLowerCase())) {
        next.push(part);
      }
    }
    onChangeWords(next);
    setCustomInput('');
  };

  const filteredSaved = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q)
      return savedWords;
    return savedWords.filter(w => w.toLowerCase().includes(q));
  }, [savedWords, search]);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={['72%', '90%']}
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
        {/* Header */}
        <View className="border-b border-line px-5 pt-1 pb-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="font-nunito text-lg font-black text-mascot-navy dark:text-white">
                {translate('story.word_sheet_title')}
              </Text>
              <Text className="font-inter text-xs text-neutral-500 dark:text-neutral-400">
                {translate('story.word_sheet_subtitle', { count: selectedWords.length, max: MAX_STORY_WORDS })}
              </Text>
            </View>
            <Pressable
              onPress={() => bottomSheetRef.current?.dismiss()}
              className="size-9 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
            >
              <CloseIcon width={16} height={16} color={surface.textMuted} />
            </Pressable>
          </View>

          {/* Free Custom Word Input — Learn ANY words freely */}
          <View className="mt-3.5 flex-row gap-2">
            <TextInput
              value={customInput}
              onChangeText={setCustomInput}
              onSubmitEditing={handleAddCustom}
              placeholder={translate('story.custom_placeholder')}
              placeholderTextColor={surface.textMuted}
              returnKeyType="done"
              style={{ color: surface.text, borderColor: surface.border, backgroundColor: surface.background }}
              className="h-11 flex-1 rounded-xl border px-3.5 font-inter text-sm"
            />
            <Pressable
              onPress={handleAddCustom}
              className="h-11 flex-row items-center justify-center gap-1 rounded-xl border-b-4 border-brand-edge bg-brand px-4"
            >
              <PlusIcon width={16} height={16} color="#17330B" />
              <Text className="font-nunito text-xs font-black text-[#17330B]">
                {translate('story.add_word')}
              </Text>
            </Pressable>
          </View>
        </View>

        <BottomSheetScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: Math.max(insets.bottom, 20) + 72,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Selected Words Tray */}
          <View className="mb-5">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="font-nunito text-xs font-extrabold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
                {`${translate('story.selected_words_label')} (${selectedWords.length}/${MAX_STORY_WORDS})`}
              </Text>
              {selectedWords.length > 0 && (
                <Pressable onPress={() => onChangeWords([])} hitSlop={8}>
                  <Text className="font-nunito text-xs font-extrabold text-danger-600 dark:text-danger-400">
                    {translate('story.clear_all')}
                  </Text>
                </Pressable>
              )}
            </View>

            {selectedWords.length === 0 ? (
              <View className="rounded-2xl border border-dashed border-line p-4">
                <Text className="text-center font-inter text-xs text-neutral-400">
                  {translate('story.selected_empty_hint')}
                </Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap gap-2">
                {selectedWords.map(w => (
                  <Pressable
                    key={w}
                    onPress={() => toggleWord(w)}
                    className="min-h-9 flex-row items-center gap-1.5 rounded-xl border border-primary-500 bg-primary-50 px-3 dark:border-primary-400 dark:bg-primary-500/20"
                  >
                    <Text className="font-nunito text-xs font-black text-primary-800 dark:text-primary-200">
                      {w}
                    </Text>
                    <CloseIcon width={12} height={12} color="#4E7A25" />
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Saved Words Library */}
          {savedWords.length > 0 && (
            <View>
              <Text className="mb-2 font-nunito text-xs font-extrabold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
                {translate('my_words.title')}
              </Text>
              {savedWords.length > 8 && (
                <View className="mb-3 flex-row items-center rounded-xl border border-line bg-neutral-50 px-3 py-2 dark:bg-neutral-800">
                  <SearchIcon width={16} height={16} color={surface.textMuted} />
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder={translate('story.search_saved_placeholder')}
                    placeholderTextColor={surface.textMuted}
                    className="ml-2 flex-1 p-0 font-inter text-xs text-neutral-800 dark:text-white"
                  />
                </View>
              )}

              <View className="flex-row flex-wrap gap-2">
                {filteredSaved.map((w) => {
                  const active = selectedWords.some(s => s.toLowerCase() === w.toLowerCase());
                  return (
                    <Pressable
                      key={w}
                      onPress={() => toggleWord(w)}
                      className={`min-h-9 flex-row items-center gap-1.5 rounded-xl border px-3 ${
                        active
                          ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-500/20'
                          : 'border-line bg-surface-raised'
                      }`}
                    >
                      {active && <CheckIcon width={12} height={12} color="#4E7A25" />}
                      <Text className={`font-nunito text-xs font-extrabold ${active ? 'text-primary-700 dark:text-primary-300' : 'text-mascot-navy dark:text-neutral-200'}`}>
                        {w}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
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

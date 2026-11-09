import type { WordSuggestionResponse } from '@/features/lookup/types';
import { ActivityIndicator, Alert } from 'react-native';
import { Pressable, showErrorMessage, showSuccessMessage, Text, View } from '@/components/ui';
import { BookIcon, FolderIcon, MoreVerticalIcon } from '@/components/ui/icons';
import { useColorMode } from '@/components/ui/surface';
import { translate } from '@/lib/i18n';
import { useSetMyWord } from '../api';

type Props = {
  word: WordSuggestionResponse;
  onOpen: () => void;
  onAdd: () => void;
};

export function PersonalWordRow({ word, onOpen, onAdd }: Props) {
  const dark = useColorMode() === 'dark';
  const mutation = useSetMyWord();
  const options = () => Alert.alert(word.word, translate('my_words.actions_hint'), [
    { text: translate('my_words.cancel'), style: 'cancel' },
    {
      text: translate('my_words.remove'),
      style: 'destructive',
      onPress: () => mutation.mutate({ wordId: Number(word.id), saved: false }, {
        onSuccess: () => showSuccessMessage(translate('my_words.removed')),
        onError: () => showErrorMessage(translate('my_words.save_error')),
      }),
    },
  ], { cancelable: true });
  return (
    <View className="min-h-20 flex-row items-center gap-1 border-b border-line bg-surface py-2 pr-2 pl-4">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={translate('my_words.open_word', { word: word.word })}
        testID={`my-word-${word.id}`}
        onPress={onOpen}
        onLongPress={options}
        className="min-h-14 flex-1 flex-row items-center gap-3 pr-2 active:opacity-70"
      >
        <View className="size-10 items-center justify-center rounded-xl bg-surface-raised">
          <BookIcon width={20} height={20} color={dark ? '#B5D894' : '#4E7A25'} />
        </View>
        <Text numberOfLines={2} className="flex-1 font-nunito text-xl font-extrabold text-mascot-navy dark:text-white">{word.word}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={translate('my_words.add_word_to_collection', { word: word.word })}
        testID={`my-word-add-${word.id}`}
        onPress={onAdd}
        className="size-12 items-center justify-center rounded-xl bg-primary-50 active:bg-primary-100 dark:bg-primary-900/40 dark:active:bg-primary-900/50"
      >
        <FolderIcon width={22} height={22} color={dark ? '#B5D894' : '#4E7A25'} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={translate('my_words.word_options', { word: word.word })}
        accessibilityState={{ disabled: mutation.isPending, busy: mutation.isPending }}
        disabled={mutation.isPending}
        testID={`my-word-options-${word.id}`}
        onPress={options}
        className="size-12 items-center justify-center rounded-xl active:bg-pressed"
      >
        {mutation.isPending
          ? <ActivityIndicator />
          : <MoreVerticalIcon width={22} height={22} color={dark ? '#B5B8C4' : '#565879'} />}
      </Pressable>
    </View>
  );
}

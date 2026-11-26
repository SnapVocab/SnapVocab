import type { ScanItem } from '../types';
import { ActivityIndicator, Pressable } from 'react-native';
import { Button, showErrorMessage, showSuccessMessage, Text, View } from '@/components/ui';
import { CheckCircleIcon } from '@/components/ui/icons';
import { useSetMyWord } from '@/features/my-words/api';
import { translate } from '@/lib/i18n';
import { primaryIpa, RELIABILITY_COLORS, RELIABILITY_KEYS, translationFor } from '../display';

/** Where one detected word stands on its way into the learner's topic. */
export type ItemSaveState = 'idle' | 'saving' | 'saved' | 'duplicate' | 'needs_form' | 'error';

type Props = {
  item: ScanItem;
  /** The colour of this item's box on the photo, so the two can be matched. */
  color: string;
  selected: boolean;
  onPress: () => void;
  saveState: ItemSaveState;
  /** One tap: the dictionary entry into the destination topic. */
  onSave: () => void;
  /** The add-word form, for words the dictionary cannot fill (or does not know). */
  onOpenForm: () => void;
};

export function DetectedItemCard({ item, color, selected, onPress, saveState, onSave, onOpenForm }: Props) {
  const reliabilityColor = RELIABILITY_COLORS[item.reliability];
  const word = item.word;
  const ipa = primaryIpa(word);
  const meaning = translationFor(word);
  const title = word?.word ?? item.label;

  return (
    <Pressable
      onPress={onPress}
      testID={`scan-item-${item.label}`}
      // Only override when selected: an explicit `undefined` border colour renders black.
      style={selected ? { borderColor: color } : undefined}
      className="flex-row overflow-hidden rounded-3xl border-2 border-b-4 border-line bg-surface"
    >
      {/* Same colour as the box on the photo. */}
      <View style={{ width: 6, backgroundColor: color }} />

      <View className="flex-1 p-4">
        <View className="flex-row items-start gap-3">
          <Text
            numberOfLines={2}
            className="flex-1 font-nunito text-2xl/8 font-extrabold text-mascot-navy dark:text-white"
          >
            {title}
          </Text>
          <View
            style={{ borderColor: `${reliabilityColor}66`, backgroundColor: `${reliabilityColor}1A` }}
            className="mt-1 flex-row items-center gap-1.5 rounded-full border px-2.5 py-1"
          >
            <View style={{ backgroundColor: reliabilityColor }} className="size-2 rounded-full" />
            <Text
              className="text-[10px] font-extrabold tracking-wide text-neutral-700 uppercase dark:text-neutral-200"
              tx={RELIABILITY_KEYS[item.reliability]}
            />
          </View>
        </View>

        {title.toLowerCase() !== item.label.toLowerCase() && (
          <Text className="text-xs text-neutral-400">{item.label}</Text>
        )}

        {word
          ? (
              <View className="mt-1 flex-row flex-wrap items-center">
                {ipa && <Text className="mr-2 text-[15px] text-neutral-500">{ipa}</Text>}
                {meaning && (
                  <Text className="text-[15px] font-bold text-neutral-800 dark:text-neutral-100">{meaning}</Text>
                )}
              </View>
            )
          : <Text className="mt-1 text-[13px] font-medium text-danger-500" tx="scan.result.not_in_dictionary" />}

        <View className="mt-3 gap-2">
          {word?.wordId
            ? <SaveAction state={saveState} onSave={onSave} onOpenForm={onOpenForm} label={item.label} />
            : (
                <Button
                  tx="scan.result.fill_manually"
                  variant="white"
                  onPress={onOpenForm}
                  testID={`scan-item-form-${item.label}`}
                  className="h-auto min-h-12 py-2.5"
                  textClassName="shrink"
                />
              )}
          {word?.wordId ? <MyWordsLink wordId={word.wordId} saved={word.inMyVocabulary} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

function SaveAction({ state, onSave, onOpenForm, label }: { state: ItemSaveState; onSave: () => void; onOpenForm: () => void; label: string }) {
  if (state === 'saved' || state === 'duplicate') {
    return (
      <View
        className="min-h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-3 dark:bg-emerald-950/40"
        accessibilityLiveRegion="polite"
        testID={`scan-item-state-${label}`}
      >
        <CheckCircleIcon width={18} height={18} color="#059669" />
        <Text
          className="font-nunito text-sm font-black text-emerald-700 dark:text-emerald-300"
          tx={state === 'saved' ? 'scan.result.saved' : 'scan.result.duplicate'}
        />
      </View>
    );
  }
  if (state === 'needs_form') {
    return (
      <View className="gap-1.5">
        <Text className="text-xs text-neutral-600 dark:text-neutral-300" tx="scan.result.needs_form_hint" />
        <Button
          tx="scan.result.fill_manually"
          variant="white"
          onPress={onOpenForm}
          testID={`scan-item-form-${label}`}
          className="h-auto min-h-12 py-2.5"
          textClassName="shrink"
        />
      </View>
    );
  }
  return (
    <View className="gap-1.5">
      {state === 'error' && <Text className="text-xs text-danger-600 dark:text-danger-400" tx="scan.result.save_error" />}
      <Button
        tx={state === 'error' ? 'scan.result.retry_save' : 'scan.result.add_to_topic'}
        variant="primary"
        loading={state === 'saving'}
        onPress={onSave}
        testID={`scan-item-save-${label}`}
        className="h-auto min-h-12 py-2.5"
        textClassName="shrink"
      />
    </View>
  );
}

/** "Từ của tôi" is a bookmark beside the learning path, so it is a small link, not a second button. */
function MyWordsLink({ wordId, saved }: { wordId: number; saved: boolean }) {
  const mutation = useSetMyWord();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={mutation.isPending}
      hitSlop={6}
      onPress={() => mutation.mutate({ wordId, saved: !saved }, {
        onSuccess: () => showSuccessMessage(translate(saved ? 'my_words.removed' : 'my_words.saved')),
        onError: () => showErrorMessage(translate('my_words.save_error')),
      })}
      className="min-h-10 flex-row items-center justify-center gap-2 self-center px-2"
    >
      {mutation.isPending && <ActivityIndicator size="small" />}
      <Text
        className="text-xs font-bold text-primary-700 dark:text-primary-200"
        tx={saved ? 'scan.result.my_words_remove' : 'scan.result.my_words_add'}
      />
    </Pressable>
  );
}

import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { MnemonicTarget } from '@/features/study/components/mnemonic-sheet';
import type { LeechWord, Mnemonic } from '@/features/study/mnemonic-api';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import { ChevronRightIcon, SparklesIcon } from '@/components/ui/icons';
import { useSurface } from '@/components/ui/surface';
import { MnemonicSheet } from '@/features/study/components/mnemonic-sheet';
import { MnemonicText } from '@/features/study/components/mnemonic-text';
import { translate } from '@/lib/i18n';

const PREVIEW = 8;

type Props = {
  items: LeechWord[];
  /** Every leech of the learner, when known; more than shown adds "Xem tất cả". */
  total?: number;
  /** The full list screen shows everything and no link. */
  showAll?: boolean;
};

/** "Từ hay quên": the most forgotten words; tapping one opens its AI mnemonic. */
export function LeechWordsCard({ items, total, showAll = false }: Props) {
  const surface = useSurface();
  const router = useRouter();
  const visible = showAll ? items : items.slice(0, PREVIEW);
  const count = Math.max(total ?? 0, items.length);
  const sheetRef = React.useRef<BottomSheetModal>(null);
  const [target, setTarget] = React.useState<MnemonicTarget | null>(null);

  const open = (word: LeechWord) => {
    setTarget({ topicItemId: word.topicItemId, word: word.word, forgetCount: word.forgetCount, mnemonic: word.mnemonic });
    sheetRef.current?.present();
  };

  return (
    <View className="gap-1 rounded-2xl border border-line bg-surface p-3.5" testID="leech-words-card">
      <Text className="mb-1 font-inter text-[12px]/4 text-neutral-500 dark:text-neutral-400">{translate('mnemonic.leeches_hint')}</Text>
      {items.length === 0
        ? (
            <Text className="py-2 font-inter text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
              {translate('mnemonic.leeches_empty')}
            </Text>
          )
        : visible.map(word => (
            <Pressable
              key={word.topicItemId}
              accessibilityRole="button"
              onPress={() => open(word)}
              testID={`leech-${word.topicItemId}`}
              className="flex-row items-center gap-3 rounded-xl px-1 py-2.5 active:bg-pressed"
            >
              <View className="flex-1 gap-0.5">
                <View className="flex-row items-center gap-2">
                  <Text className="shrink font-nunito text-[15px] font-black text-mascot-navy dark:text-white" numberOfLines={1}>{word.word}</Text>
                  <Text className="rounded-full bg-rose-50 px-2 py-0.5 font-inter text-[10px] font-bold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                    {translate('mnemonic.forgot_times', { count: word.forgetCount })}
                  </Text>
                </View>
                {word.mnemonic
                  ? <MnemonicText mnemonic={word.mnemonic} numberOfLines={1} className="font-inter text-xs text-amber-800 dark:text-amber-200" />
                  : word.meaning
                    ? <Text className="font-inter text-xs text-neutral-500 dark:text-neutral-400" numberOfLines={1}>{word.meaning}</Text>
                    : null}
              </View>
              {word.mnemonic
                ? <SparklesIcon width={16} height={16} color="#D97706" />
                : <ChevronRightIcon width={16} height={16} color={surface.textMuted} />}
            </Pressable>
          ))}
      {!showAll && count > visible.length && (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/leech-words')}
          testID="leech-see-all"
          className="mt-1 flex-row items-center justify-center gap-1 rounded-xl border border-line py-2.5 active:bg-pressed"
        >
          <Text className="font-nunito text-sm font-black text-sky-700 dark:text-sky-300">
            {translate('mnemonic.leeches_see_all', { count })}
          </Text>
          <ChevronRightIcon width={14} height={14} color={surface.textMuted} />
        </Pressable>
      )}
      <MnemonicSheet
        ref={sheetRef}
        target={target}
        onChanged={(topicItemId: number, mnemonic: Mnemonic | null) =>
          setTarget(current => current && current.topicItemId === topicItemId ? { ...current, mnemonic } : current)}
        onRequestClose={() => sheetRef.current?.dismiss()}
        onDismissed={() => setTarget(null)}
      />
    </View>
  );
}

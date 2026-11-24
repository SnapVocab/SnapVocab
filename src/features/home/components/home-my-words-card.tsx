import { useRouter } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';
import { Pressable, Text, useSurface } from '@/components/ui';
import { BookIcon, ChevronRightIcon } from '@/components/ui/icons';
import { useMyWords } from '@/features/my-words/api';
import { formatCount } from '@/lib/format-count';
import { getLanguage, translate } from '@/lib/i18n';

const MAX_RECENT_CHIPS = 4;

/**
 * Compact "My Words" card on Home: opens the full library or jumps directly
 * to any of the learner's 4 most recently saved words.
 */
export function HomeMyWordsCard() {
  const router = useRouter();
  const surface = useSurface();
  const query = useMyWords();
  const firstPage = query.data?.pages[0];
  const recentWords = (firstPage?.data ?? []).slice(0, MAX_RECENT_CHIPS);
  const total = firstPage?.meta.total;

  return (
    <View className="mb-3 overflow-hidden rounded-2xl border-2 border-b-4 border-line border-b-edge bg-surface">
      <Pressable
        onPress={() => router.push('/my-words')}
        accessibilityRole="button"
        accessibilityLabel={translate('my_words.title')}
        testID="home-my-words-card"
        className="min-h-14 flex-row items-center gap-3 px-4 pt-3.5 pb-3 active:bg-pressed"
      >
        <View className="size-10 items-center justify-center rounded-xl border-b-[3px] border-brand-edge bg-brand">
          <BookIcon width={20} height={20} color={surface.onBrand} />
        </View>
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="font-nunito text-[15px] font-black text-mascot-navy dark:text-white" tx="my_words.title" />
            {total !== undefined && (
              <View className="rounded-full bg-primary-50 px-2 py-0.5 dark:bg-primary-500/15">
                <Text className="font-nunito text-[11px] font-extrabold text-primary-700 tabular-nums dark:text-primary-300">
                  {translate('home.my_words_count', { count: formatCount(total, getLanguage()) })}
                </Text>
              </View>
            )}
          </View>
          <Text className="mt-0.5 font-inter text-xs text-neutral-500 dark:text-neutral-300" numberOfLines={1}>
            {recentWords.length > 0
              ? translate('home.my_words_recent_hint')
              : translate('home.my_words_empty_hint')}
          </Text>
        </View>
        <ChevronRightIcon color={surface.action} width={20} height={20} />
      </Pressable>

      {recentWords.length > 0 && (
        <>
          <View className="mx-4 h-px bg-line" />
          <View className="flex-row flex-wrap gap-2 px-4 py-3">
            {recentWords.map(item => (
              <Pressable
                key={item.id}
                onPress={() => router.push({ pathname: '/word-detail', params: { id: String(item.id), word: item.word } })}
                accessibilityRole="button"
                accessibilityLabel={item.word}
                className="min-h-9 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface-raised px-3 active:bg-pressed"
              >
                <Text className="font-nunito text-xs font-extrabold text-mascot-navy dark:text-white" numberOfLines={1}>
                  {item.word}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

export default HomeMyWordsCard;

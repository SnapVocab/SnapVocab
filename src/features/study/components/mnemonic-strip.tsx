import type { Mnemonic } from '../mnemonic-api';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import { SparklesIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';
import { MnemonicText } from './mnemonic-text';

type StripProps = { mnemonic: Mnemonic | null; offer: boolean; onOpen: () => void };

/** On a card's back, above the rating buttons: the learner's mnemonic, or the offer to make one for a leech. */
export function MnemonicStrip({ mnemonic, offer, onOpen }: StripProps) {
  if (mnemonic) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${translate('mnemonic.your_tip')}: ${mnemonic.content}`}
        onPress={onOpen}
        testID="mnemonic-strip"
        className="mb-3 gap-1 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 active:opacity-80 dark:border-amber-500/30 dark:bg-amber-500/10"
      >
        <View className="flex-row items-center gap-1.5">
          <SparklesIcon width={14} height={14} color="#D97706" />
          <Text className="font-inter text-[11px] font-bold tracking-wide text-amber-800 uppercase dark:text-amber-200">
            {translate('mnemonic.your_tip')}
          </Text>
        </View>
        <MnemonicText mnemonic={mnemonic} numberOfLines={3} className="font-inter text-sm/5 text-neutral-800 dark:text-neutral-100" />
      </Pressable>
    );
  }
  if (!offer)
    return null;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onOpen}
      testID="mnemonic-offer"
      className="mb-3 flex-row items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/60 py-2.5 active:opacity-80 dark:border-amber-500/40 dark:bg-amber-500/10"
    >
      <SparklesIcon width={16} height={16} color="#D97706" />
      <Text className="font-nunito text-sm font-black text-amber-800 dark:text-amber-200">{translate('mnemonic.create')}</Text>
    </Pressable>
  );
}

type BannerProps = { forgetCount: number; onOpen: () => void; onDismiss: () => void };

/** Right after the "Quên" that makes the previous card a leech; it stays until used or dismissed. */
export function LeechBanner({ forgetCount, onOpen, onDismiss }: BannerProps) {
  return (
    <View
      accessibilityLiveRegion="polite"
      testID="leech-banner"
      className="mx-4 mt-3 flex-row items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 py-2 pr-2 pl-3 dark:border-amber-500/30 dark:bg-amber-500/10"
    >
      <SparklesIcon width={16} height={16} color="#D97706" />
      <Text className="flex-1 font-inter text-xs/4 font-semibold text-amber-900 dark:text-amber-100">
        {translate('mnemonic.banner', { count: forgetCount })}
      </Text>
      <Pressable accessibilityRole="button" onPress={onDismiss} hitSlop={6} className="rounded-lg px-2 py-1.5 active:bg-pressed">
        <Text className="font-inter text-xs font-bold text-neutral-500 dark:text-neutral-400">{translate('mnemonic.dismiss')}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onOpen} hitSlop={6} className="rounded-lg bg-amber-400 px-2.5 py-1.5 active:opacity-80 dark:bg-amber-500" testID="leech-banner-open">
        <Text className="font-nunito text-xs font-black text-amber-950">{translate('mnemonic.banner_action')}</Text>
      </Pressable>
    </View>
  );
}

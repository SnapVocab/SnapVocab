import type { BottomSheetBackdropProps, BottomSheetModal } from '@gorhom/bottom-sheet';
import type { BadgeItem } from '../types';
import { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Image as ExpoImage } from 'expo-image';
import * as React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, useSurface } from '@/components/ui';
import { AppBottomSheetModal } from '@/components/ui/app-bottom-sheet-modal';
import { CheckCircleIcon, CloseIcon, LockIcon, SparklesIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';
import { amount, ctaOf, noteOf, unitOf } from '../copy';
import { formatEarnedDate, isRecording, metricRoute, shownProgress } from '../model';
import { BadgeImage, ProgressBar } from './badge-image';
import { frameLabel, RewardChips } from './reward-chips';

type Props = {
  item: BadgeItem | null;
  stale: boolean;
  onClose: () => void;
  onNavigate: (route: '/study/quiz-setup' | '/collections') => void;
};

/** Second layer: full status, the metric's rule note and at most one action (§6). */
export function AchievementDetailSheet({ item, stale, onClose, onNavigate }: Props) {
  const ref = React.useRef<BottomSheetModal>(null);
  const surface = useSurface();
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    if (item)
      ref.current?.present();
    else
      ref.current?.dismiss();
  }, [item]);

  const renderBackdrop = React.useCallback(
    (props: BottomSheetBackdropProps) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />,
    [],
  );

  return (
    <AppBottomSheetModal
      ref={ref}
      onDismiss={onClose}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: '#CBD5E1', width: 40, height: 5 }}
      backgroundStyle={{ backgroundColor: surface.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
    >
      <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 24 + insets.bottom }}>
        {item && <SheetBody item={item} stale={stale} onClose={() => ref.current?.dismiss()} onNavigate={onNavigate} />}
      </BottomSheetScrollView>
    </AppBottomSheetModal>
  );
}

/** PD-BDG-14: what this badge pays, or paid. A badge earned before rewards existed says so instead of showing nothing. */
function RewardBox({ item }: { item: BadgeItem }) {
  const { reward } = item;
  if (item.reward === undefined || (!reward && !item.earned))
    return null;
  if (!reward) {
    return <Text className="mb-4 text-center font-inter text-[13px] text-neutral-400">{translate('badges.reward.legacy')}</Text>;
  }
  const frame = reward.item;
  return (
    <View className="mb-4 w-full rounded-2xl border border-neutral-200/80 bg-neutral-50 p-3.5 dark:border-neutral-700 dark:bg-neutral-800">
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <Text className="font-nunito text-[13px] font-extrabold text-neutral-600 dark:text-neutral-300">
          {translate(item.earned ? 'badges.reward.title_earned' : 'badges.reward.title_locked')}
        </Text>
        <RewardChips reward={reward} size="md" />
      </View>
      {frame && (
        <View className="mt-3 flex-row items-center gap-3">
          {frame.previewUrl
            ? <ExpoImage source={{ uri: frame.previewUrl }} contentFit="contain" cachePolicy="memory-disk" style={{ width: 56, height: 56, borderRadius: 12 }} />
            : <View className="size-14 rounded-xl border border-purple-200 bg-purple-50" />}
          <View className="flex-1">
            <Text className="font-nunito text-[15px] font-extrabold text-mascot-navy dark:text-white">{frame.name}</Text>
            <Text className="font-inter text-[12px] text-neutral-500 dark:text-neutral-300">
              {frame.granted === null ? frameLabel(frame) : translate(frame.granted ? 'badges.reward.in_inventory' : 'badges.reward.already_owned')}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

function SheetBody({ item, stale, onClose, onNavigate }: Omit<Props, 'item' | 'onClose'> & { item: BadgeItem; onClose: () => void }) {
  const recording = isRecording(item);
  const route = !item.earned && !recording ? metricRoute(item.metric) : null;
  const cta = route ? ctaOf(item.metric) : null;
  const note = noteOf(item.metric);

  return (
    <View className="items-center">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={translate('badges.sheet.close')}
        onPress={onClose}
        hitSlop={8}
        className="absolute top-0 right-0 z-10 size-9 items-center justify-center rounded-full border border-neutral-200/60 bg-neutral-100 active:opacity-70 dark:border-neutral-700 dark:bg-neutral-800"
      >
        <CloseIcon width={18} height={18} color="#565879" />
      </Pressable>

      <View className="my-2">
        <BadgeImage item={item} size={144} />
        {item.earned && (
          <View className="absolute -top-1 -right-1 rounded-full border border-reward-300 bg-reward-100 p-1.5">
            <SparklesIcon width={18} height={18} color="#FFC42E" />
          </View>
        )}
      </View>

      <View className="mt-1 mb-3 flex-row items-center gap-2">
        <View className={`flex-row items-center gap-1 rounded-full border px-3 py-1 ${item.earned ? 'border-success-200 bg-success-50' : 'border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800'}`}>
          {item.earned ? <CheckCircleIcon width={13} height={13} color="#3C8C00" /> : <LockIcon width={13} height={13} color="#64748B" />}
          <Text className={`font-nunito text-[11px] font-extrabold tracking-wider uppercase ${item.earned ? 'text-success-700 dark:text-success-700' : 'text-neutral-600 dark:text-neutral-300'}`}>
            {translate(item.earned ? 'badges.status.unlocked' : 'badges.status.locked')}
          </Text>
        </View>
      </View>

      <Text accessibilityRole="header" className="mb-1 text-center font-nunito text-[24px] leading-[30px] font-extrabold text-mascot-navy dark:text-white">{item.name}</Text>
      <Text className="mb-4 px-4 text-center font-inter text-[14px] leading-relaxed text-neutral-500 dark:text-neutral-300">{item.description}</Text>

      <RewardBox item={item} />

      {item.earned && (
        <View className="mb-4 w-full flex-row items-center justify-between rounded-xl border border-neutral-200/60 bg-neutral-50 px-4 py-2.5 dark:border-neutral-700 dark:bg-neutral-800">
          <Text className="font-inter text-[12px] font-bold text-neutral-500 dark:text-neutral-300">{translate('badges.sheet.earned_date')}</Text>
          <Text className="font-nunito text-[13px] font-extrabold text-mascot-navy dark:text-white">{formatEarnedDate(item.earnedAt)}</Text>
        </View>
      )}

      {recording && (
        <View className="mb-4 w-full items-center rounded-2xl border-2 border-b-4 border-reward-200 bg-reward-50 p-4">
          <Text className="font-inter text-[15px] font-semibold text-[#8A5A00] dark:text-[#8A5A00]">{translate('badges.sheet.eligible')}</Text>
          {!stale && (
            <View className="mt-1 flex-row items-center gap-1.5">
              <ActivityIndicator size="small" color="#A87400" />
              <Text className="font-inter text-[14px] text-neutral-500">{translate('badges.recording')}</Text>
            </View>
          )}
        </View>
      )}

      {!item.earned && !recording && (
        <View className="mb-4 w-full rounded-2xl border-2 border-b-4 border-neutral-200/80 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="font-inter text-[13px] font-bold text-neutral-600 dark:text-neutral-300">{translate('badges.sheet.progress')}</Text>
            <Text className="font-nunito text-[14px] font-extrabold text-mascot-navy tabular-nums dark:text-white">{`${shownProgress(item)} / ${amount(item.threshold, item.metric)}`}</Text>
          </View>
          <ProgressBar percent={(shownProgress(item) / item.threshold) * 100} className="h-3" />
          <Text className="mt-2 font-inter text-[13px] text-neutral-500 dark:text-neutral-300">
            {item.currentValue === 0
              ? translate('badges.sheet.not_started')
              : translate('badges.sheet.remaining', { remaining: item.threshold - item.currentValue, unit: unitOf(item.metric) })}
          </Text>
        </View>
      )}

      {note && (
        <View className="mb-4 w-full rounded-2xl bg-neutral-100 px-3 py-2.5 dark:bg-neutral-800">
          <Text className="font-inter text-[14px]/5 text-neutral-600 dark:text-neutral-300">{note}</Text>
        </View>
      )}

      {route && cta && (
        <Pressable
          accessibilityRole="link"
          onPress={() => {
            onClose();
            onNavigate(route);
          }}
          className="w-full items-center justify-center rounded-2xl border-b-4 border-primary-700 bg-primary-500 py-3.5 active:translate-y-[2px] active:border-b-2"
        >
          <Text className="font-nunito text-[15px] font-extrabold tracking-wider text-white uppercase">{cta}</Text>
        </Pressable>
      )}
    </View>
  );
}

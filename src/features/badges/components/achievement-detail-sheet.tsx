import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import type { BadgeItem, BadgeSeries } from '../types';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AchievementArtifact } from '@/components/snapvocab';
import { Text, useSurface } from '@/components/ui';
import { CheckCircleIcon, CloseIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';
import { amount, ctaOf, noteOf, unitOf } from '../copy';
import { formatEarnedDate, isRecording, metricRoute, nextIndex } from '../model';
import { AchievementShelf } from './achievement-shelf';

type Props = {
  item: BadgeItem | null;
  series: BadgeSeries | undefined;
  seriesList: BadgeSeries[];
  stale: boolean;
  onClose: () => void;
  onNavigate: (route: '/study/quiz-setup' | '/collections') => void;
};

/** Second layer: full status, series context, the metric's rule note and at most one tertiary action (§6). */
export function AchievementDetailSheet({ item, series, seriesList, stale, onClose, onNavigate }: Props) {
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
    <BottomSheetModal
      ref={ref}
      onDismiss={onClose}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: '#CBD5E1', width: 40, height: 5 }}
      backgroundStyle={{ backgroundColor: surface.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
    >
      <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 24 + insets.bottom }}>
        {item && <SheetBody item={item} series={series} seriesList={seriesList} stale={stale} onClose={() => ref.current?.dismiss()} onNavigate={onNavigate} />}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

function SheetBody({ item, series, seriesList, stale, onClose, onNavigate }: Omit<Props, 'item' | 'onClose'> & { item: BadgeItem; onClose: () => void }) {
  const recording = isRecording(item);
  const state = item.earned ? 'earned' : recording ? 'recording' : series && series.items[nextIndex(series)]?.id === item.id ? 'next' : 'locked';
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
        className="absolute top-0 right-0 z-10 size-[34px] items-center justify-center rounded-full bg-neutral-100 active:opacity-70 dark:bg-neutral-800"
      >
        <CloseIcon width={16} height={16} color="#565879" />
      </Pressable>

      <AchievementArtifact metric={item.metric} iconKey={item.iconKey} threshold={item.threshold} state={state} size={112} />
      <Text accessibilityRole="header" className="mt-1 text-center font-nunito text-[22px] leading-[30px] font-extrabold text-mascot-navy dark:text-white">{item.name}</Text>
      <Text className="mt-0.5 text-center font-inter text-[15px] leading-[22px] text-neutral-500 dark:text-neutral-300">{item.description}</Text>

      <View accessible className="mt-3 items-center">
        {item.earned
          ? (
              <View className="flex-row items-center gap-1.5">
                <CheckCircleIcon width={20} height={20} color="#3C8C00" />
                <Text className="font-inter text-[15px] font-semibold text-mascot-navy dark:text-white">
                  {translate('badges.sheet.earned_on', { date: formatEarnedDate(item.earnedAt) })}
                </Text>
              </View>
            )
          : recording
            ? (
                <>
                  <Text className="font-inter text-[15px] font-semibold text-[#8A5A00] dark:text-reward-300">{translate('badges.sheet.eligible')}</Text>
                  {!stale && (
                    <View className="mt-1 flex-row items-center gap-1.5">
                      <ActivityIndicator size="small" color="#A87400" />
                      <Text className="font-inter text-[14px] text-neutral-500 dark:text-neutral-300">{translate('badges.recording')}</Text>
                    </View>
                  )}
                </>
              )
            : (
                <>
                  <Text className="font-nunito text-[26px] font-extrabold text-mascot-navy tabular-nums dark:text-white">
                    {`${item.currentValue} / ${amount(item.threshold, item.metric)}`}
                  </Text>
                  <Text className="font-inter text-[14px] text-neutral-500 dark:text-neutral-300">
                    {item.currentValue === 0
                      ? translate('badges.sheet.not_started')
                      : translate('badges.sheet.remaining', { remaining: item.threshold - item.currentValue, unit: unitOf(item.metric) })}
                  </Text>
                </>
              )}
      </View>

      {series && series.items.length > 1 && (
        <View className="mt-4 w-full">
          <AchievementShelf series={series} seriesList={seriesList} size="mini" focusedId={item.id} />
        </View>
      )}

      {note && (
        <View className="mt-3 w-full rounded-2xl bg-neutral-100 px-3 py-2.5 dark:bg-neutral-800">
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
          className="mt-2 min-h-12 justify-center px-3 active:opacity-60"
        >
          <Text className="font-nunito text-[15px] font-extrabold text-primary-800 dark:text-primary-300">{cta}</Text>
        </Pressable>
      )}
    </View>
  );
}

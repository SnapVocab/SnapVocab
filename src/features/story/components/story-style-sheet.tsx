import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import type { StoryGenre, StoryLevel, StoryMode } from '../types';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Pressable, Text, useSurface } from '@/components/ui';
import { CloseIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';

const LEVELS: StoryLevel[] = ['A1', 'A2', 'B1', 'B2'];
const GENRES: { id: StoryGenre; labelKey: string }[] = [
  { id: 'DAILY', labelKey: 'story.genre_daily' },
  { id: 'FUNNY', labelKey: 'story.genre_funny' },
  { id: 'OFFICE', labelKey: 'story.genre_office' },
  { id: 'TRAVEL', labelKey: 'story.genre_travel' },
];

type Props = {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  mode: StoryMode;
  level: StoryLevel;
  genre: StoryGenre;
  onChangeMode: (m: StoryMode) => void;
  onChangeLevel: (lv: StoryLevel) => void;
  onChangeGenre: (g: StoryGenre) => void;
};

export function StoryStyleSheet({
  bottomSheetRef,
  mode,
  level,
  genre,
  onChangeMode,
  onChangeLevel,
  onChangeGenre,
}: Props) {
  const insets = useSafeAreaInsets();
  const surface = useSurface();

  const renderBackdrop = React.useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      enableDynamicSizing
      stackBehavior="replace"
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: surface.border, width: 36, height: 4 }}
      backgroundStyle={{ backgroundColor: surface.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
    >
      <BottomSheetView
        style={{
          paddingHorizontal: 20,
          paddingTop: 4,
          paddingBottom: Math.max(insets.bottom, 16) + 12,
          backgroundColor: surface.surface,
        }}
      >
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="font-nunito text-lg font-black text-mascot-navy dark:text-white">
            {translate('story.style_sheet_title')}
          </Text>
          <Pressable
            onPress={() => bottomSheetRef.current?.dismiss()}
            className="size-9 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
          >
            <CloseIcon width={16} height={16} color={surface.textMuted} />
          </Pressable>
        </View>

        {/* Mode */}
        <Text className="mb-2 font-nunito text-xs font-extrabold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
          {translate('story.mode_label')}
        </Text>
        <View className="mb-4 flex-row gap-2.5">
          {(['BLENDED', 'ENGLISH'] as const).map((m) => {
            const active = mode === m;
            return (
              <Pressable
                key={m}
                onPress={() => onChangeMode(m)}
                className={`min-h-14 flex-1 rounded-2xl border-2 border-b-4 p-3 ${
                  active
                    ? 'border-primary-500 border-b-primary-700 bg-primary-50 dark:border-[#7FA35E] dark:bg-primary-500/15'
                    : 'border-line border-b-edge bg-surface'
                }`}
              >
                <Text className={`font-nunito text-sm font-black ${active ? 'text-primary-700 dark:text-primary-300' : 'text-mascot-navy dark:text-white'}`}>
                  {translate(m === 'BLENDED' ? 'story.mode_blended' : 'story.mode_english')}
                </Text>
                <Text className="mt-0.5 font-inter text-xs text-neutral-500 dark:text-neutral-300">
                  {translate(m === 'BLENDED' ? 'story.mode_blended_desc' : 'story.mode_english_desc')}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Level */}
        <Text className="mb-2 font-nunito text-xs font-extrabold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
          {translate('story.level_label')}
        </Text>
        <View className="mb-4 flex-row gap-2">
          {LEVELS.map((lv) => {
            const active = level === lv;
            return (
              <Pressable
                key={lv}
                onPress={() => onChangeLevel(lv)}
                className={`min-h-11 flex-1 items-center justify-center rounded-xl border-2 ${
                  active
                    ? 'border-primary-500 bg-primary-50 dark:border-[#7FA35E] dark:bg-primary-500/20'
                    : 'border-line bg-surface'
                }`}
              >
                <Text className={`font-nunito text-xs font-black ${active ? 'text-primary-700 dark:text-primary-300' : 'text-mascot-navy dark:text-white'}`}>
                  {lv}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Genre */}
        <Text className="mb-2 font-nunito text-xs font-extrabold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
          {translate('story.genre_label')}
        </Text>
        <View className="mb-5 flex-row flex-wrap gap-2">
          {GENRES.map((g) => {
            const active = genre === g.id;
            return (
              <Pressable
                key={g.id}
                onPress={() => onChangeGenre(g.id)}
                className={`min-h-11 items-center justify-center rounded-xl border-2 px-4 ${
                  active
                    ? 'border-amber-500 bg-amber-50 dark:border-amber-400 dark:bg-amber-500/20'
                    : 'border-line bg-surface'
                }`}
              >
                <Text className={`font-nunito text-xs font-extrabold ${active ? 'text-amber-800 dark:text-amber-300' : 'text-mascot-navy dark:text-white'}`}>
                  {translate(g.labelKey as any)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Button
          label={translate('story.apply_style')}
          onPress={() => bottomSheetRef.current?.dismiss()}
        />
      </BottomSheetView>
    </BottomSheetModal>
  );
}

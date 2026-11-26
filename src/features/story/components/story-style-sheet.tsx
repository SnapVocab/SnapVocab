import type { BottomSheetBackdropProps, BottomSheetModal } from '@gorhom/bottom-sheet';
import type { StoryGenre } from '../types';
import { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Pressable, Text, useSurface } from '@/components/ui';
import { AppBottomSheetModal } from '@/components/ui/app-bottom-sheet-modal';
import { CloseIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';

const GENRES: { id: StoryGenre; labelKey: string }[] = [
  { id: 'DAILY', labelKey: 'story.genre_daily' },
  { id: 'FUNNY', labelKey: 'story.genre_funny' },
  { id: 'OFFICE', labelKey: 'story.genre_office' },
  { id: 'TRAVEL', labelKey: 'story.genre_travel' },
];

type Props = {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  genre: StoryGenre;
  onChangeGenre: (g: StoryGenre) => void;
};

export function StoryStyleSheet({
  bottomSheetRef,
  genre,
  onChangeGenre,
}: Props) {
  const insets = useSafeAreaInsets();
  const surface = useSurface();

  const renderBackdrop = React.useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <AppBottomSheetModal
      ref={bottomSheetRef}
      enableDynamicSizing
      stackBehavior="replace"
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: surface.border, width: 36, height: 4 }}
      backgroundStyle={{
        backgroundColor: surface.surface,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
      }}
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
            {translate('story.genre_label')}
          </Text>
          <Pressable
            onPress={() => bottomSheetRef.current?.dismiss()}
            className="size-9 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
          >
            <CloseIcon width={16} height={16} color={surface.textMuted} />
          </Pressable>
        </View>

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
                <Text
                  className={`font-nunito text-xs font-extrabold ${
                    active ? 'text-amber-800 dark:text-amber-300' : 'text-mascot-navy dark:text-white'
                  }`}
                >
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
    </AppBottomSheetModal>
  );
}

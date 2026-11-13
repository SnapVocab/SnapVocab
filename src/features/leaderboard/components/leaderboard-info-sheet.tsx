import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, useSurface } from '@/components/ui';
import { CloseIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';

/** "Cách tính XP và xu hướng": the rules live here instead of above the board (§2.1). */
export function LeaderboardInfoSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = React.useRef<BottomSheetModal>(null);
  const surface = useSurface();
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    if (open)
      ref.current?.present();
    else
      ref.current?.dismiss();
  }, [open]);

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
      <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 + insets.bottom }}>
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="flex-1 font-nunito text-lg font-black text-mascot-navy dark:text-white">{translate('leaderboard.help')}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={translate('leaderboard.close')}
            onPress={() => ref.current?.dismiss()}
            className="size-12 items-center justify-center rounded-full active:bg-pressed"
          >
            <CloseIcon width={20} height={20} color={surface.text} />
          </Pressable>
        </View>
        {(['leaderboard.rules', 'leaderboard.trend_note', 'leaderboard.timing'] as const).map(key => (
          <Text key={key} className="mb-3 font-inter text-[15px] text-neutral-600 dark:text-neutral-200">{translate(key)}</Text>
        ))}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

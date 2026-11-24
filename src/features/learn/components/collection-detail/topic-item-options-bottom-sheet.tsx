import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import type { TopicItemData } from '../../types';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUniwind } from 'uniwind';
import { Button, Pressable, showErrorMessage, showSuccessMessage, Text } from '@/components/ui';
import colors from '@/components/ui/colors';
import { EditIcon, TrashIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';
import { useDeleteTopicItem } from '../../api';
import { extractTopicItemDisplay } from './topic-item-utils';

type Props = {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  item: TopicItemData | null;
  topicId: number | null;
  onEdit: (item: TopicItemData) => void;
};

export function TopicItemOptionsBottomSheet({ bottomSheetRef, item, topicId, onEdit }: Props) {
  const insets = useSafeAreaInsets();
  const { theme } = useUniwind();
  const isDark = theme === 'dark';
  const word = item ? extractTopicItemDisplay(item).word : '';
  const [currentView, setCurrentView] = React.useState<'MENU' | 'DELETE'>('MENU');
  const { mutate: deleteTopicItem, isPending } = useDeleteTopicItem();

  const handleDismiss = React.useCallback(() => {
    setCurrentView('MENU');
  }, []);

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

  const handleEdit = React.useCallback(() => {
    if (!item) {
      return;
    }
    bottomSheetRef.current?.dismiss();
    onEdit(item);
  }, [bottomSheetRef, item, onEdit]);

  const handleDelete = React.useCallback(() => {
    if (!item || topicId === null || isPending) {
      return;
    }
    setCurrentView('DELETE');
  }, [isPending, item, topicId]);

  const handleConfirmDelete = React.useCallback(() => {
    if (!item || topicId === null || isPending) {
      return;
    }

    deleteTopicItem(
      { topicId, itemId: item.topicItemId },
      {
        onSuccess: () => {
          bottomSheetRef.current?.dismiss();
          showSuccessMessage(translate('learn.topic_item_options.delete_success'));
        },
        onError: (error) => {
          showErrorMessage(error.response?.data?.error || translate('learn.topic_item_options.delete_error'));
        },
      },
    );
  }, [bottomSheetRef, deleteTopicItem, isPending, item, topicId]);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      stackBehavior="replace"
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      onDismiss={handleDismiss}
      handleIndicatorStyle={{
        backgroundColor: isDark ? colors.darkTheme.border : '#CBD5E1',
        width: 36,
        height: 4,
      }}
      backgroundStyle={{
        backgroundColor: isDark ? colors.darkTheme.surface : '#FFFFFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
      }}
    >
      <BottomSheetView style={{ paddingBottom: Math.max(insets.bottom, 24) }} className="px-5 pt-2">
        {currentView === 'MENU'
          ? (
              <>
                <View className="mb-4 border-b border-line pb-4">
                  <Text className="font-nunito text-lg font-extrabold text-mascot-navy dark:text-white">
                    {word}
                  </Text>
                </View>
                <Pressable
                  onPress={handleEdit}
                  className="mb-2 flex-row items-center overflow-hidden rounded-2xl bg-neutral-50 p-3.5 active:opacity-70 dark:bg-neutral-800/60"
                >
                  <View className="mr-3 size-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/60">
                    <EditIcon width={18} height={18} color="#3B82F6" />
                  </View>
                  <Text className="font-nunito text-[15px] font-bold text-mascot-navy dark:text-white">
                    {translate('learn.topic_item_options.edit')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleDelete}
                  disabled={isPending || topicId === null}
                  className="flex-row items-center overflow-hidden rounded-2xl bg-rose-50 p-3.5 active:opacity-70 dark:bg-rose-950/30"
                >
                  <View className="mr-3 size-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/70">
                    <TrashIcon width={18} height={18} color="#E11D48" />
                  </View>
                  <Text className="font-nunito text-[15px] font-bold text-rose-700 dark:text-rose-300">
                    {translate('learn.topic_item_options.delete')}
                  </Text>
                </Pressable>
              </>
            )
          : (
              <View className="items-center gap-3 pt-2">
                <View className="size-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/60">
                  <TrashIcon width={22} height={22} color="#E11D48" />
                </View>
                <Text className="text-center font-nunito text-lg font-extrabold text-rose-600 dark:text-rose-400">
                  {translate('learn.topic_item_options.delete_confirm_title')}
                </Text>
                <Text className="px-2 text-center font-inter text-sm/5 text-neutral-600 dark:text-neutral-300">
                  {translate('learn.topic_item_options.delete_confirm_message', { word })}
                </Text>
                <View className="mt-3 w-full flex-row gap-3">
                  <Button
                    variant="white"
                    label={translate('learn.topic_item_options.cancel')}
                    disabled={isPending}
                    onPress={() => setCurrentView('MENU')}
                    className="flex-1"
                  />
                  <Button
                    variant="destructive"
                    label={translate('learn.topic_item_options.delete')}
                    loading={isPending}
                    disabled={isPending}
                    onPress={handleConfirmDelete}
                    className="flex-1"
                  />
                </View>
              </View>
            )}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

export default TopicItemOptionsBottomSheet;

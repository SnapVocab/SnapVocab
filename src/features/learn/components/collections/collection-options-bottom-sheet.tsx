import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import type { Collection } from '../../types';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input, Text } from '@/components/ui';
import { CloseIcon, EditIcon, FolderIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';

type Props = {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  collection: Collection | null;
  onSaveEdit?: (collection: Collection, name: string, description: string) => void;
  onDelete?: (collection: Collection) => void;
};

export default function CollectionOptionsBottomSheet({
  bottomSheetRef,
  collection,
  onSaveEdit,
  onDelete,
}: Props) {
  const insets = useSafeAreaInsets();
  const [currentView, setCurrentView] = React.useState<'MENU' | 'EDIT' | 'DELETE'>('MENU');
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [nameError, setNameError] = React.useState('');

  const handleDismiss = () => {
    setCurrentView('MENU');
    setNameError('');
  };

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

  const handleOpenEdit = () => {
    if (!collection)
      return;
    setName(collection.name);
    setDescription(collection.translation ?? '');
    setNameError('');
    setCurrentView('EDIT');
  };

  const handleSave = () => {
    if (!collection)
      return;
    if (!name.trim()) {
      setNameError('Tên bộ sưu tập không được để trống');
      return;
    }
    bottomSheetRef.current?.dismiss();
    onSaveEdit?.(collection, name.trim(), description.trim());
  };

  const handleConfirmDelete = () => {
    if (!collection)
      return;
    bottomSheetRef.current?.dismiss();
    onDelete?.(collection);
  };

  const isUserCollection = collection?.type === 'USER';

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      onDismiss={handleDismiss}
      handleIndicatorStyle={{ backgroundColor: '#CBD5E1', width: 36, height: 4 }}
      backgroundStyle={{
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
      }}
    >
      <BottomSheetView style={{ paddingBottom: Math.max(insets.bottom, 24) }} className="px-5 pt-2">
        {collection && currentView === 'MENU' && (
          <>
            {/* Header Preview */}
            <View className="mb-4 flex-row items-center border-b border-neutral-100 pb-4 dark:border-neutral-800">
              <View className="mr-3.5 size-12 items-center justify-center rounded-2xl border border-lime-200 bg-lime-50 dark:border-lime-900/60 dark:bg-lime-950/40">
                <FolderIcon width={22} height={22} color="#65A30D" />
              </View>
              <View className="flex-1">
                <Text
                  className="font-nunito text-[16px] font-extrabold text-mascot-navy dark:text-white"
                  numberOfLines={1}
                >
                  {collection.name}
                </Text>
                <Text
                  className="mt-0.5 font-inter text-[13px] font-medium text-neutral-500 dark:text-neutral-400"
                  numberOfLines={1}
                >
                  {collection.translation}
                </Text>
              </View>
            </View>

            {/* Actions List */}
            <View className="gap-2">
              {/* Action: Edit (User collections only) */}
              {isUserCollection && (
                <Pressable
                  onPress={handleOpenEdit}
                  android_ripple={{ color: 'transparent' }}
                  className="flex-row items-center rounded-2xl bg-neutral-50 p-3.5 active:opacity-70 dark:bg-neutral-800/60"
                >
                  <View className="mr-3 size-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/60">
                    <EditIcon width={18} height={18} color="#3B82F6" />
                  </View>
                  <Text className="font-nunito text-[15px] font-bold text-mascot-navy dark:text-white">
                    {translate('learn.collections.options_edit')}
                  </Text>
                </Pressable>
              )}

              {/* Action: Delete (User collections only) */}
              {isUserCollection && (
                <Pressable
                  onPress={() => setCurrentView('DELETE')}
                  android_ripple={{ color: 'transparent' }}
                  className="flex-row items-center rounded-2xl bg-rose-50/60 p-3.5 active:opacity-70 dark:bg-rose-950/30"
                >
                  <View className="mr-3 size-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/50">
                    <CloseIcon width={16} height={16} color="#E11D48" />
                  </View>
                  <Text className="font-nunito text-[15px] font-bold text-rose-600 dark:text-rose-400">
                    {translate('learn.collections.options_delete')}
                  </Text>
                </Pressable>
              )}
            </View>
          </>
        )}

        {/* View: Edit Form */}
        {collection && currentView === 'EDIT' && (
          <View className="gap-3 pt-1">
            <Text className="mb-1 text-center font-nunito text-lg font-extrabold text-mascot-navy dark:text-white">
              Chỉnh sửa bộ sưu tập
            </Text>

            <Input
              label="Tên bộ sưu tập (*)"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (nameError)
                  setNameError('');
              }}
              placeholder="Nhập tên bộ sưu tập..."
              error={nameError}
            />

            <Input
              label="Mô tả"
              value={description}
              onChangeText={setDescription}
              placeholder="Nhập mô tả / nghĩa..."
            />

            <View className="mt-2 flex-row gap-3">
              <Button
                variant="white"
                label="Hủy bỏ"
                onPress={() => setCurrentView('MENU')}
                className="flex-1"
              />
              <Button
                variant="primary"
                label="Lưu thay đổi"
                onPress={handleSave}
                className="flex-1"
              />
            </View>
          </View>
        )}

        {/* View: Delete Confirmation */}
        {collection && currentView === 'DELETE' && (
          <View className="items-center gap-3 pt-2">
            <View className="size-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/60">
              <CloseIcon width={22} height={22} color="#E11D48" />
            </View>

            <Text className="text-center font-nunito text-lg font-extrabold text-rose-600 dark:text-rose-400">
              Xóa bộ sưu tập
            </Text>

            <Text className="px-2 text-center font-inter text-sm/5 text-neutral-600 dark:text-neutral-300">
              Bạn chắc chắn muốn xóa bộ sưu tập "
              {collection.name}
              "? Thao tác này không thể hoàn tác.
            </Text>

            <View className="mt-3 w-full flex-row gap-3">
              <Button
                variant="white"
                label="Hủy bỏ"
                onPress={() => setCurrentView('MENU')}
                className="flex-1"
              />
              <Button
                variant="destructive"
                label="Xác nhận xóa"
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

export { CollectionOptionsBottomSheet };

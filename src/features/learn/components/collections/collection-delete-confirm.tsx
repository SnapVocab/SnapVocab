import type { Collection } from '../../types';
import * as React from 'react';
import { View } from 'react-native';
import { Button, showErrorMessage, Text } from '@/components/ui';
import { CloseIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';
import { useDeleteCollection } from '../../api';

type Props = {
  collection: Collection;
  onSuccess: () => void;
  onCancel: () => void;
};

export function CollectionDeleteConfirm({ collection, onSuccess, onCancel }: Props) {
  const { mutate: deleteCollection, isPending } = useDeleteCollection();

  const handleConfirmDelete = () => {
    deleteCollection(collection.id, {
      onSuccess: () => {
        onSuccess();
      },
      onError: (error) => {
        const message = error.response?.data?.error || translate('learn.collections.delete_error');
        showErrorMessage(message);
      },
    });
  };

  return (
    <View className="items-center gap-3 pt-2">
      <View className="size-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/60">
        <CloseIcon width={22} height={22} color="#E11D48" />
      </View>

      <Text className="text-center font-nunito text-lg font-extrabold text-rose-600 dark:text-rose-400">
        {translate('learn.collections.delete_title')}
      </Text>

      <Text className="px-2 text-center font-inter text-sm/5 text-neutral-600 dark:text-neutral-300">
        {translate('learn.collections.delete_confirm_desc', { name: collection.name })}
      </Text>

      <View className="mt-3 w-full flex-row gap-3">
        <Button
          variant="white"
          label={translate('learn.collections.cancel')}
          disabled={isPending}
          onPress={onCancel}
          className="flex-1"
        />
        <Button
          variant="destructive"
          label={translate('learn.collections.confirm_delete')}
          loading={isPending}
          disabled={isPending}
          onPress={handleConfirmDelete}
          className="flex-1"
        />
      </View>
    </View>
  );
}

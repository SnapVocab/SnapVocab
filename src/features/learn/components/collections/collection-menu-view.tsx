import type { Collection } from '../../types';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import { CloseIcon, EditIcon, FolderIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';

type Props = {
  collection: Collection;
  onOpenEdit: () => void;
  onOpenDelete: () => void;
};

export function CollectionMenuView({ collection, onOpenEdit, onOpenDelete }: Props) {
  const isUserCollection = collection.type === 'USER';

  return (
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
            onPress={onOpenEdit}
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
            onPress={onOpenDelete}
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
  );
}

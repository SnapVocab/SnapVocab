import type { CollectionRef } from '../../types';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Text, useSurface } from '@/components/ui';
import { CloseIcon, EditIcon, FolderIcon, SettingsIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';

type Props = {
  collection: CollectionRef;
  onOpenEdit: () => void;
  onOpenDelete: () => void;
  onStudy?: () => void;
  onStudySettings: () => void;
};

export function CollectionMenuView({ collection, onOpenEdit, onOpenDelete, onStudy, onStudySettings }: Props) {
  const surface = useSurface();
  const isUserCollection = collection.type === 'USER';

  return (
    <>
      {/* Header Preview */}
      <View className="mb-4 flex-row items-center border-b border-line pb-4">
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
        <Pressable
          accessibilityRole="button"
          onPress={onStudySettings}
          className="min-h-14 flex-row items-center rounded-2xl bg-surface-raised p-3.5 active:bg-pressed"
        >
          <View className="mr-3 size-10 items-center justify-center rounded-xl bg-background">
            <SettingsIcon width={20} height={20} color={surface.textMuted} />
          </View>
          <Text className="shrink font-nunito text-[15px] font-bold text-mascot-navy dark:text-white" tx="study_limits.title" />
        </Pressable>
        {/* Action: Study / View */}
        {onStudy && (
          <Pressable
            onPress={onStudy}
            android_ripple={{ color: 'transparent' }}
            className="flex-row items-center rounded-2xl bg-emerald-50/60 p-3.5 active:opacity-70 dark:bg-emerald-950/30"
          >
            <View className="mr-3 size-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/50">
              <FolderIcon width={18} height={18} color="#059669" />
            </View>
            <Text className="font-nunito text-[15px] font-bold text-emerald-700 dark:text-emerald-300">
              {translate('learn.collections.options_study')}
            </Text>
          </Pressable>
        )}

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

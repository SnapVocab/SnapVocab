import type { ParentBreadcrumb } from '../../use-collection-detail';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/ui';
import { ChevronRightIcon, FolderIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';

type Props = {
  parentStack: ParentBreadcrumb[];
  rootName: string;
  onBreadcrumbPress: (index: number) => void;
};

export function CollectionBreadcrumbBar({ parentStack, rootName, onBreadcrumbPress }: Props) {
  if (parentStack.length === 0) {
    return null;
  }

  return (
    <View className="border-b border-line bg-surface/90 px-4 py-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="flex-row items-center gap-1.5 py-0.5"
      >
        {/* Root collection button */}
        <Pressable
          onPress={() => onBreadcrumbPress(-1)}
          hitSlop={6}
          className="flex-row items-center gap-1.5 rounded-xl border-2 border-b-[3px] border-line border-b-edge bg-surface-raised px-2.5 py-1 active:translate-y-px active:border-b-2"
        >
          <FolderIcon width={12} height={12} color="#65A30D" />
          <Text className="font-nunito text-xs font-black text-lime-700 dark:text-lime-400">
            {rootName || translate('learn.collection_detail.root_level')}
          </Text>
        </Pressable>

        {/* Stack hierarchy crumbs */}
        {parentStack.map((crumb, idx) => {
          const isLast = idx === parentStack.length - 1;
          return (
            <View key={crumb.id} className="flex-row items-center gap-1.5">
              <ChevronRightIcon width={12} height={12} color="#A3A3A3" />

              <Pressable
                onPress={() => !isLast && onBreadcrumbPress(idx)}
                disabled={isLast}
                hitSlop={6}
                className={`flex-row items-center rounded-xl border-2 border-b-[3px] px-2.5 py-1 ${
                  isLast
                    ? 'border-primary-300 border-b-primary-500 bg-primary-50 dark:border-line dark:border-b-[#9BCB72] dark:bg-surface'
                    : 'border-line border-b-edge bg-white active:translate-y-px active:border-b-2 dark:bg-surface-raised'
                }`}
              >
                <Text
                  className={`font-nunito text-xs ${
                    isLast
                      ? 'font-black text-primary-700 dark:text-primary-300'
                      : 'font-bold text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  {crumb.name}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default CollectionBreadcrumbBar;

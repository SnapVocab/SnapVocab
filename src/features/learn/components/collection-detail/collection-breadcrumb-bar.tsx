import type { ParentBreadcrumb } from '../../use-collection-detail';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/ui';
import { ChevronRightIcon } from '@/components/ui/icons';
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
    <View className="flex-row items-center border-b border-neutral-100 bg-neutral-50/80 px-4 py-2.5 dark:border-neutral-800 dark:bg-neutral-900/50">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="flex-row items-center"
      >
        {/* Root collection link */}
        <Pressable onPress={() => onBreadcrumbPress(-1)} hitSlop={6}>
          <Text className="font-nunito text-xs font-bold text-primary-600 dark:text-primary-400">
            {rootName || translate('learn.collection_detail.root_level')}
          </Text>
        </Pressable>

        {/* Stack hierarchy crumbs */}
        {parentStack.map((crumb, idx) => {
          const isLast = idx === parentStack.length - 1;
          return (
            <View key={crumb.id} className="flex-row items-center">
              <View className="mx-1.5">
                <ChevronRightIcon width={12} height={12} color="#9CA3AF" />
              </View>
              <Pressable
                onPress={() => !isLast && onBreadcrumbPress(idx)}
                disabled={isLast}
                hitSlop={6}
              >
                <Text
                  className={`font-nunito text-xs ${
                    isLast
                      ? 'font-black text-mascot-navy dark:text-white'
                      : 'font-bold text-primary-600 dark:text-primary-400'
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

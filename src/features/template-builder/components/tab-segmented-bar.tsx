import type { CardSide } from '../types';
import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui/text';

type TabSegmentedBarProps = {
  activeTab: CardSide;
  onTabChange: (tab: CardSide) => void;
  frontFieldCount: number;
  backFieldCount: number;
};

export function TabSegmentedBar({
  activeTab,
  onTabChange,
  frontFieldCount,
  backFieldCount,
}: TabSegmentedBarProps) {
  const isFront = activeTab === 'FRONT';

  return (
    <View className="bg-slate-50 px-4 py-3 dark:bg-neutral-900">
      <View className="flex-row rounded-2xl bg-neutral-200/80 p-1 dark:bg-neutral-800">
        {/* Front Tab */}
        <TouchableOpacity
          onPress={() => onTabChange('FRONT')}
          className={`flex-1 flex-row items-center justify-center rounded-xl py-2.5 transition-all ${
            isFront
              ? 'bg-white shadow-sm dark:bg-neutral-700'
              : 'bg-transparent'
          }`}
          activeOpacity={0.8}
        >
          <Text
            tx="template_builder.front_side"
            className={`font-inter text-xs font-black tracking-wider ${
              isFront
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-neutral-500 dark:text-neutral-400'
            }`}
          />
          <View
            className={`ml-2 rounded-full px-2 py-0.5 ${
              isFront
                ? 'bg-emerald-100 dark:bg-emerald-900/60'
                : 'bg-neutral-300/60 dark:bg-neutral-600'
            }`}
          >
            <Text
              className={`text-[10px] font-bold ${
                isFront
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {frontFieldCount}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Back Tab */}
        <TouchableOpacity
          onPress={() => onTabChange('BACK')}
          className={`flex-1 flex-row items-center justify-center rounded-xl py-2.5 transition-all ${
            !isFront
              ? 'bg-white shadow-sm dark:bg-neutral-700'
              : 'bg-transparent'
          }`}
          activeOpacity={0.8}
        >
          <Text
            tx="template_builder.back_side"
            className={`font-inter text-xs font-black tracking-wider ${
              !isFront
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-neutral-500 dark:text-neutral-400'
            }`}
          />
          <View
            className={`ml-2 rounded-full px-2 py-0.5 ${
              !isFront
                ? 'bg-emerald-100 dark:bg-emerald-900/60'
                : 'bg-neutral-300/60 dark:bg-neutral-600'
            }`}
          >
            <Text
              className={`text-[10px] font-bold ${
                !isFront
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {backFieldCount}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

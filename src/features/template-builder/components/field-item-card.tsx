import type { BuilderField, CardSide } from '../types';
import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { MoreVerticalIcon, VolumeIcon } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';
import { translate } from '@/lib/i18n/utils';

type FieldItemCardProps = {
  field: BuilderField;
  sectionId: string;
  side: CardSide;
  onPress: () => void;
  onMorePress?: () => void;
  isCompact?: boolean;
};

export function FieldItemCard({
  field,
  onPress,
  onMorePress,
  isCompact = false,
}: FieldItemCardProps) {
  const getRoleLabel = () => {
    if (!field.semanticRole) {
      return translate('template_builder.unassigned_role');
    }
    try {
      return translate(`template_builder.roles.${field.semanticRole}` as any);
    }
    catch {
      return field.semanticRole;
    }
  };

  const getAlignmentLabel = () => {
    switch (field.alignment) {
      case 'CENTER':
        return translate('template_builder.align_center');
      case 'RIGHT':
        return translate('template_builder.align_right');
      case 'LEFT':
      default:
        return translate('template_builder.align_left');
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`rounded-xl border border-neutral-200/80 bg-neutral-50 shadow-sm dark:border-neutral-700 dark:bg-neutral-800/80 ${
        isCompact ? 'p-2.5' : 'p-3'
      }`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center">
          {/* Color indicator dot */}
          <View
            className="mr-2.5 size-3.5 rounded-full border border-black/10"
            style={{ backgroundColor: field.color || '#111827' }}
          />

          <View className="flex-1">
            <View className="flex-row items-center">
              <Text
                className="font-nunito text-sm font-black text-mascot-navy dark:text-white"
                numberOfLines={1}
              >
                {field.fieldLabel}
              </Text>
              {field.required && (
                <Text className="ml-1 text-xs font-bold text-red-500">*</Text>
              )}
            </View>
            <Text
              className="font-inter text-[11px] font-medium text-neutral-400 dark:text-neutral-400"
              numberOfLines={1}
            >
              {field.attributeName}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center">
          {field.audioAction && (
            <View className="mr-1 rounded-lg bg-blue-100/80 p-1 dark:bg-blue-950/60">
              <VolumeIcon color="#0284C7" width={14} height={14} />
            </View>
          )}

          <TouchableOpacity
            onPress={onMorePress ?? onPress}
            hitSlop={8}
            className="p-1"
          >
            <MoreVerticalIcon color="#9CA3AF" width={20} height={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Meta tags / badges */}
      <View className="mt-2.5 flex-row flex-wrap items-center gap-1.5">
        {/* Role badge */}
        <View className="rounded-md bg-neutral-200/60 px-2 py-0.5 dark:bg-neutral-700">
          <Text className="font-inter text-[10px] font-bold text-neutral-600 dark:text-neutral-300">
            {getRoleLabel()}
          </Text>
        </View>

        {/* Font size badge */}
        <View className="rounded-md bg-neutral-200/60 px-1.5 py-0.5 dark:bg-neutral-700">
          <Text className="font-inter text-[10px] font-extrabold text-neutral-600 dark:text-neutral-300">
            {translate('template_builder.size_badge', { size: field.fontSize })}
          </Text>
        </View>

        {/* Alignment badge */}
        <View className="rounded-md bg-neutral-200/60 px-1.5 py-0.5 dark:bg-neutral-700">
          <Text className="font-inter text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
            {getAlignmentLabel()}
          </Text>
        </View>

        {field.hideIfEmpty && (
          <View className="rounded-md bg-amber-100/80 px-1.5 py-0.5 dark:bg-amber-950/40">
            <Text
              tx="template_builder.hide_if_empty_badge"
              className="font-inter text-[10px] font-bold text-amber-700 dark:text-amber-400"
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

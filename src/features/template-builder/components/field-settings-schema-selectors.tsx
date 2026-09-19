import type { DataType } from '../types';
import * as React from 'react';
import { Switch, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { translate } from '@/lib/i18n/utils';

export function DataTypeSelector({
  dataType = 'TEXT',
  onSelect,
}: {
  dataType?: DataType;
  onSelect: (dt: DataType) => void;
}) {
  const types: { key: DataType; label: string }[] = [
    { key: 'TEXT', label: translate('template_builder.data_types.TEXT') },
    { key: 'AUDIO', label: translate('template_builder.data_types.AUDIO') },
    { key: 'IMAGE', label: translate('template_builder.data_types.IMAGE') },
    { key: 'NUMBER', label: translate('template_builder.data_types.NUMBER') },
    { key: 'BOOLEAN', label: translate('template_builder.data_types.BOOLEAN') },
  ];

  return (
    <View className="mb-4">
      <Text
        tx="template_builder.field_settings.data_type"
        className="mb-1.5 font-inter text-xs font-bold text-neutral-600 uppercase dark:text-neutral-300"
      />
      <View className="flex-row flex-wrap gap-2">
        {types.map(t => (
          <TouchableOpacity
            key={t.key}
            onPress={() => onSelect(t.key)}
            className={`rounded-xl border px-3 py-2 ${
              dataType === t.key
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                : 'border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800'
            }`}
          >
            <Text
              className={`font-inter text-xs font-semibold ${
                dataType === t.key
                  ? 'font-bold text-emerald-600 dark:text-emerald-400'
                  : 'text-neutral-700 dark:text-neutral-300'
              }`}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export function ToggleSection({
  required,
  onToggleRequired,
  hideIfEmpty,
  onToggleHideIfEmpty,
  audioAction,
  onToggleAudioAction,
}: {
  required: boolean;
  onToggleRequired: (v: boolean) => void;
  hideIfEmpty: boolean;
  onToggleHideIfEmpty: (v: boolean) => void;
  audioAction: boolean;
  onToggleAudioAction: (v: boolean) => void;
}) {
  return (
    <View className="mb-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800/50">
      <View className="flex-row items-center justify-between py-1.5">
        <View className="flex-1 pr-3">
          <Text
            tx="template_builder.field_settings.required"
            className="font-inter text-xs font-bold text-mascot-navy dark:text-white"
          />
          <Text
            tx="template_builder.field_settings.required_desc"
            className="font-inter text-[11px] text-neutral-400"
          />
        </View>
        <Switch
          value={required}
          onValueChange={onToggleRequired}
          trackColor={{ false: '#E5E7EB', true: '#16A34A' }}
        />
      </View>

      <View className="my-1 border-t border-neutral-200/60 dark:border-neutral-700/60" />

      <View className="flex-row items-center justify-between py-1.5">
        <View className="flex-1 pr-3">
          <Text
            tx="template_builder.field_settings.hide_if_empty"
            className="font-inter text-xs font-bold text-mascot-navy dark:text-white"
          />
          <Text
            tx="template_builder.field_settings.hide_if_empty_desc"
            className="font-inter text-[11px] text-neutral-400"
          />
        </View>
        <Switch
          value={hideIfEmpty}
          onValueChange={onToggleHideIfEmpty}
          trackColor={{ false: '#E5E7EB', true: '#16A34A' }}
        />
      </View>

      <View className="my-1 border-t border-neutral-200/60 dark:border-neutral-700/60" />

      <View className="flex-row items-center justify-between py-1.5">
        <View className="flex-1 pr-3">
          <Text
            tx="template_builder.field_settings.audio_action"
            className="font-inter text-xs font-bold text-mascot-navy dark:text-white"
          />
          <Text
            tx="template_builder.field_settings.audio_action_desc"
            className="font-inter text-[11px] text-neutral-400"
          />
        </View>
        <Switch
          value={audioAction}
          onValueChange={onToggleAudioAction}
          trackColor={{ false: '#E5E7EB', true: '#16A34A' }}
        />
      </View>
    </View>
  );
}

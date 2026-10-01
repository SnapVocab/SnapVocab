import type { SchemaAttributeGroupDTO } from '@/features/template-builder/types';
import * as React from 'react';
import { View } from 'react-native';
import { Pressable, Text } from '@/components/ui';
import { LayersIcon, PlusIcon, TrashIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';
import { DynamicFormField } from './dynamic-form-field';

type Props = {
  group: SchemaAttributeGroupDTO;
  instances: Record<string, any>[];
  onChangeInstanceField: (index: number, fieldName: string, value: any) => void;
  onAddInstance: () => void;
  onRemoveInstance: (index: number) => void;
  errors?: Record<number, Record<string, string>>;
  onSpeak?: (text: string) => void;
};

export function MultipleGroupSection({
  group,
  instances,
  onChangeInstanceField,
  onAddInstance,
  onRemoveInstance,
  errors = {},
  onSpeak,
}: Props) {
  const sortedAttributes = React.useMemo(() => {
    return [...(group.attributes || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [group.attributes]);

  return (
    <View className="mb-6 rounded-3xl border-2 border-neutral-200/80 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      {/* Section Header */}
      <View className="mb-4 flex-row items-center justify-between border-b border-neutral-100 pb-3 dark:border-neutral-800">
        <View className="flex-row items-center">
          <View className="mr-2.5 size-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/60">
            <LayersIcon width={16} height={16} color="#059669" />
          </View>
          <Text className="font-nunito text-base font-black text-mascot-navy dark:text-white">
            {group.label || group.name}
          </Text>
          <View className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 dark:bg-emerald-950/60">
            <Text className="font-nunito text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
              {instances.length}
            </Text>
          </View>
        </View>
      </View>

      {/* List of Instances */}
      <View className="gap-3">
        {instances.map((instanceValues, index) => {
          const itemErrors = errors[index] || {};
          const canDelete = instances.length > 1;

          return (
            <View
              // eslint-disable-next-line react/no-array-index-key
              key={`item_${index}`}
              className="rounded-2xl border border-neutral-200/80 bg-neutral-50/70 p-3.5 dark:border-neutral-800 dark:bg-neutral-800/40"
            >

              {/* Item Card Header */}
              <View className="mb-3 flex-row items-center justify-between border-b border-neutral-200/60 pb-2 dark:border-neutral-700/60">
                <View className="rounded-lg bg-neutral-200/80 px-2 py-0.5 dark:bg-neutral-700">
                  <Text className="font-nunito text-xs font-extrabold text-neutral-700 dark:text-neutral-200">
                    {group.label || group.name}
                    {' '}
                    #
                    {index + 1}
                  </Text>
                </View>

                {canDelete && (
                  <Pressable
                    onPress={() => onRemoveInstance(index)}
                    hitSlop={8}
                    className="size-7 items-center justify-center rounded-lg bg-red-100 active:opacity-70 dark:bg-red-950/60"
                  >
                    <TrashIcon width={14} height={14} color="#EF4444" />
                  </Pressable>
                )}
              </View>

              {/* Fields: One field per line */}
              <View>
                {sortedAttributes.map(attr => (
                  <DynamicFormField
                    key={attr.attributeId || attr.name}
                    attribute={attr}
                    value={instanceValues[attr.name]}
                    onChange={val => onChangeInstanceField(index, attr.name, val)}
                    error={itemErrors[attr.name]}
                    onSpeak={onSpeak}
                  />
                ))}

              </View>
            </View>
          );
        })}
      </View>

      {/* Add Instance Button */}
      <Pressable
        onPress={onAddInstance}
        className="mt-4 flex-row items-center justify-center rounded-2xl border-2 border-dashed border-emerald-400/80 bg-emerald-50/50 py-3 active:opacity-75 dark:border-emerald-700/80 dark:bg-emerald-950/30"
      >
        <PlusIcon width={18} height={18} color="#059669" />
        <Text className="ml-1.5 font-nunito text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
          {translate('learn.add_word.add_item', { label: group.label || group.name })}
        </Text>
      </Pressable>
    </View>
  );
}

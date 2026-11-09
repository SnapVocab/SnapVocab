import type { SchemaAttributeGroupDTO } from '@/features/template-builder/types';
import * as React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import { BookIcon } from '@/components/ui/icons';
import { DynamicFormField } from './dynamic-form-field';

type Props = {
  group: SchemaAttributeGroupDTO;
  values: Record<string, any>;
  onChangeField: (fieldName: string, value: any) => void;
  errors?: Record<string, string>;
  onSpeak?: (text: string) => void;
  onLookup?: (text: string) => void;
  isLookupLoading?: boolean;
};

export function SingleGroupSection({
  group,
  values,
  onChangeField,
  errors = {},
  onSpeak,
  onLookup,
  isLookupLoading,
}: Props) {
  const sortedAttributes = React.useMemo(() => {
    return [...(group.attributes || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [group.attributes]);

  return (
    <View className="mb-6 rounded-3xl border-2 border-line bg-surface p-4 shadow-sm">
      {/* Section Header */}
      <View className="mb-4 flex-row items-center border-b border-line pb-3">
        <View className="mr-2.5 size-8 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/60">

          <BookIcon width={16} height={16} color="#0284C7" />
        </View>
        <Text className="font-nunito text-base font-black text-mascot-navy dark:text-white">
          {group.label || group.name}
        </Text>
      </View>

      {/* Fields: One field per line */}
      <View>
        {sortedAttributes.map(attr => (
          <DynamicFormField
            key={attr.attributeId || attr.name}
            attribute={attr}
            value={values[attr.name]}
            onChange={val => onChangeField(attr.name, val)}
            error={errors[attr.name]}
            onSpeak={onSpeak}
            onLookup={onLookup}
            isLookupLoading={isLookupLoading}
          />
        ))}
      </View>
    </View>
  );
}

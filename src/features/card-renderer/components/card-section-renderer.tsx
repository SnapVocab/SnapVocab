import type { BuilderSection, SchemaDTO, TopicSchemaDTO } from '../types';
import type { TopicItemData } from '@/features/learn/types';
import * as React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { getSectionInstanceCount } from '../utils/data-resolver';
import { CardFieldRenderer } from './card-field-renderer';

type Props = {
  section: BuilderSection;
  data?: TopicItemData | Record<string, any> | null;
  schema?: TopicSchemaDTO | SchemaDTO;
};

export function CardSectionRenderer({ section, data }: Props) {
  const instanceCount = getSectionInstanceCount(section, data);
  const isTwoColumns = section.columns === 2;

  const col1Fields = section.fields.filter(f => f.column === 1);
  const col2Fields = section.fields.filter(f => f.column === 2);

  const instanceIndices = React.useMemo(
    () => Array.from({ length: instanceCount }, (_, i) => ({ key: `${section.id}-inst-${i}`, index: i })),
    [instanceCount, section.id],
  );

  return (
    <View className="my-2 w-full">
      {/* Section Header (optional name if informative) */}
      {section.name && section.name !== 'Thông tin chung' && section.name !== 'Nghĩa & Ví dụ' && (
        <View className="mb-2 border-b border-neutral-100 pb-1 dark:border-neutral-800">
          <Text className="font-nunito text-xs font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
            {section.name}
          </Text>
        </View>
      )}

      {/* Render Instances (1 or multiple if repeatable) */}
      {instanceIndices.map(inst => (
        <View
          key={inst.key}
          className={`w-full ${
            inst.index > 0
              ? 'mt-3 border-t border-dashed border-neutral-200/80 pt-3 dark:border-neutral-700/80'
              : ''
          }`}
        >
          {isTwoColumns ? (
            <View className="w-full flex-row items-start justify-between gap-3">
              {/* Column 1 (Left - 50%) */}
              <View className="flex-1">
                {col1Fields.map(field => (
                  <CardFieldRenderer
                    key={`${field.id}-${inst.key}`}
                    field={field}
                    data={data}
                    instanceIndex={inst.index}
                  />
                ))}
              </View>

              {/* Column 2 (Right - 50%) */}
              <View className="flex-1">
                {col2Fields.map(field => (
                  <CardFieldRenderer
                    key={`${field.id}-${inst.key}`}
                    field={field}
                    data={data}
                    instanceIndex={inst.index}
                  />
                ))}
              </View>
            </View>
          ) : (
            /* Single Column (100% width) */
            <View className="w-full">
              {section.fields.map(field => (
                <CardFieldRenderer
                  key={`${field.id}-${inst.key}`}
                  field={field}
                  data={data}
                  instanceIndex={inst.index}
                />
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

export default CardSectionRenderer;

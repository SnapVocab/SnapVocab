import type { BuilderSection, SchemaDTO, TopicItemData, TopicSchemaDTO } from '../types';
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

  const showSectionHeader = Boolean(section.name && section.name.trim());

  return (
    <View className="my-2 w-full">
      {/* Section Header */}
      {showSectionHeader && (
        <View className="mb-3 flex-row items-center gap-2.5">
          <View className="h-px flex-1 bg-neutral-100 dark:bg-neutral-800" />
          <View className="flex-row items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-1 dark:bg-primary-900/30">
            <View className="size-1.5 rounded-full bg-primary-500" />
            <Text className="font-inter text-[9px] font-extrabold tracking-[1px] text-primary-700 uppercase dark:text-primary-300">
              {section.name}
            </Text>
          </View>
          <View className="h-px flex-1 bg-neutral-100 dark:bg-neutral-800" />
        </View>
      )}

      {/* Render Section Instances */}
      {instanceIndices.map(inst => (
        <View
          key={inst.key}
          className={`w-full ${
            inst.index > 0
              ? 'mt-3 border-t border-dashed border-line pt-3'
              : ''
          }`}
        >
          {isTwoColumns ? (
            /* 2-Column layout: vertically centered along cross-axis, fields gap-3.5 */
            <View className="w-full flex-row items-start justify-between gap-3">
              {/* Column 1 (Left 50%) */}
              <View className="flex-1 justify-start gap-3">
                {col1Fields.map(field => (
                  <CardFieldRenderer
                    key={`${field.id}-${inst.key}`}
                    field={field}
                    data={data}
                    instanceIndex={inst.index}
                    isRepeatableSection={section.repeatable}
                  />
                ))}
              </View>

              {/* Column 2 (Right 50%) */}
              <View className="flex-1 justify-start gap-3">
                {col2Fields.map(field => (
                  <CardFieldRenderer
                    key={`${field.id}-${inst.key}`}
                    field={field}
                    data={data}
                    instanceIndex={inst.index}
                    isRepeatableSection={section.repeatable}
                  />
                ))}
              </View>
            </View>
          ) : (
            /* Single Column layout (100% width) */
            <View className="w-full justify-center gap-3">
              {section.fields.map(field => (
                <CardFieldRenderer
                  key={`${field.id}-${inst.key}`}
                  field={field}
                  data={data}
                  instanceIndex={inst.index}
                  isRepeatableSection={section.repeatable}
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

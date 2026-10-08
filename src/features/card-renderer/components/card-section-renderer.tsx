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
    <View className="my-2.5 w-full">
      {/* Section Header */}
      {showSectionHeader && (
        <View className="mb-3.5 flex-row items-center justify-between border-b border-neutral-200/60 pb-2 dark:border-neutral-800">
          <View className="flex-row items-center gap-2">
            <View className="h-3.5 w-1 rounded-full bg-primary-500" />
            <Text className="font-nunito text-xs font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
              {section.name}
            </Text>
          </View>
        </View>
      )}

      {/* Render Section Instances */}
      {instanceIndices.map(inst => (
        <View
          key={inst.key}
          className={`w-full ${
            inst.index > 0
              ? 'mt-4 border-t border-dashed border-neutral-200/80 pt-4 dark:border-neutral-700/80'
              : ''
          }`}
        >
          {isTwoColumns ? (
            /* 2-Column layout: vertically centered along cross-axis, fields gap-3.5 */
            <View className="w-full flex-row items-center justify-between gap-4">
              {/* Column 1 (Left 50%) */}
              <View className="flex-1 justify-center gap-3.5">
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
              <View className="flex-1 justify-center gap-3.5">
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
            <View className="w-full justify-center gap-3.5">
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

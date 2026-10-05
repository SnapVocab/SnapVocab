import type { BuilderSection, CardSide, SchemaDTO, TopicItemData, TopicSchemaDTO } from '../types';
import * as React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { CardSectionRenderer } from './card-section-renderer';

type Props = {
  side: CardSide;
  sections: BuilderSection[];
  data?: TopicItemData | Record<string, any> | null;
  schema?: TopicSchemaDTO | SchemaDTO;
  isInteractive?: boolean;
};

export function CardFace({
  side,
  sections,
  data,
  schema,
  isInteractive = true,
}: Props) {
  const isFront = side === 'FRONT';

  return (
    <View className="flex-1 justify-between p-6">
      <View className="w-full">
        {/* Top Side Badge */}
        <View className="mb-3 flex-row items-center justify-between border-b border-neutral-100 pb-2.5 dark:border-neutral-800">
          <View
            className={`rounded-full px-2.5 py-0.5 ${
              isFront
                ? 'bg-emerald-100/90 dark:bg-emerald-950/70'
                : 'bg-indigo-100/90 dark:bg-indigo-950/70'
            }`}
          >
            <Text
              className={`font-inter text-[11px] font-extrabold tracking-wider ${
                isFront
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-indigo-700 dark:text-indigo-300'
              }`}
            >
              {isFront ? 'MẶT TRƯỚC' : 'MẶT SAU'}
            </Text>
          </View>
        </View>

        {/* Content Sections */}
        <View className="w-full">
          {sections.map(section => (
            <CardSectionRenderer
              key={section.id}
              section={section}
              data={data}
              schema={schema}
            />
          ))}
        </View>
      </View>

      {/* Bottom Hint */}
      {isInteractive && (
        <View className="mt-4 items-center justify-center border-t border-neutral-100/60 pt-3 dark:border-neutral-800/60">
          <Text className="font-inter text-[11px] font-medium text-neutral-400 dark:text-neutral-500">
            🔄 Chạm vào thẻ để lật mặt
          </Text>
        </View>
      )}
    </View>
  );
}

export default CardFace;

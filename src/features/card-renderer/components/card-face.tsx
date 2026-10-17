import type { BuilderSection, CardSide, SchemaDTO, TopicItemData, TopicSchemaDTO } from '../types';
import * as React from 'react';
import { ScrollView, View } from 'react-native';
import { RotateCwIcon } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';
import { translate } from '@/lib/i18n/utils';
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
    <View className="flex-1 px-5 pt-5 pb-4">
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className={`size-2 rounded-full ${isFront ? 'bg-primary-500' : 'bg-reward-500'}`} />
          <Text className="font-inter text-[10px] font-extrabold tracking-[1.5px] text-neutral-500 uppercase dark:text-neutral-400">
            {translate(isFront ? 'card_renderer.front' : 'card_renderer.back')}
          </Text>
        </View>
        <View className="rounded-full bg-neutral-100 px-2.5 py-1 dark:bg-neutral-800">
          <Text className="font-inter text-[10px] font-bold text-neutral-500 dark:text-neutral-400">
            {translate('card_renderer.card')}
          </Text>
        </View>
      </View>

      {/* Scrollable Content Sections */}
      <ScrollView
        className="w-full flex-1"
        showsVerticalScrollIndicator
        nestedScrollEnabled
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: isFront ? 'center' : 'flex-start',
          paddingBottom: 12,
        }}
      >
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
      </ScrollView>

      {isInteractive ? (
        <View className="mt-2 flex-row items-center justify-center gap-1.5 border-t border-neutral-100 pt-3 dark:border-neutral-800">
          <RotateCwIcon width={12} height={12} color="#8B91A5" />
          <Text className="font-inter text-[10px] font-semibold text-neutral-400 dark:text-neutral-500">
            {translate('card_renderer.tap_to_flip')}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default CardFace;

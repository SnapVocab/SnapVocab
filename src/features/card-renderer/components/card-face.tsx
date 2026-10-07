import type { BuilderSection, CardSide, SchemaDTO, TopicItemData, TopicSchemaDTO } from '../types';
import * as React from 'react';
import { ScrollView, View } from 'react-native';
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
}: Props) {
  const isFront = side === 'FRONT';

  return (
    <View className="flex-1 p-6">
      {/* Scrollable Content Sections */}
      <ScrollView
        className="w-full flex-1"
        showsVerticalScrollIndicator
        nestedScrollEnabled
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: isFront ? 'center' : 'flex-start',
          paddingBottom: 16,
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
    </View>
  );
}

export default CardFace;

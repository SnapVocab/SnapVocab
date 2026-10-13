import type { DynamicCardRendererProps } from './types';
import * as React from 'react';
import { View } from 'react-native';
import { templateDTOToBuilderSections } from '@/features/template-builder/mappers';
import { CardFace } from './components/card-face';
import { FlipCardContainer } from './components/flip-card-container';

export function DynamicCardRenderer({
  template,
  schema,
  frontSections: passedFrontSections,
  backSections: passedBackSections,
  data,
  side,
  onFlip,
  isInteractive = true,
  className = '',
  minHeight = 420,
}: DynamicCardRendererProps) {
  // 1. Resolve Front & Back sections from template & schema or use passed sections
  const { frontSections, backSections } = React.useMemo(() => {
    if (passedFrontSections && passedBackSections) {
      return {
        frontSections: passedFrontSections,
        backSections: passedBackSections,
      };
    }

    return templateDTOToBuilderSections(template, schema as any);
  }, [template, schema, passedFrontSections, passedBackSections]);

  return (
    <View className={`w-full ${className}`}>
      <FlipCardContainer
        side={side}
        onFlip={onFlip}
        isInteractive={isInteractive}
        minHeight={minHeight}
        frontContent={(
          <CardFace
            side="FRONT"
            sections={frontSections}
            data={data}
            schema={schema}
            isInteractive={isInteractive}
          />
        )}
        backContent={(
          <CardFace
            side="BACK"
            sections={backSections}
            data={data}
            schema={schema}
            isInteractive={isInteractive}
          />
        )}
      />
    </View>
  );
}

export default DynamicCardRenderer;

import type { CardPreviewViewProps, CardSide } from './types';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { translate } from '@/lib/i18n';
import { DynamicCardRenderer } from './dynamic-card-renderer';

export function CardPreviewView({
  template,
  schema,
  frontSections,
  backSections,
  data,
  initialSide = 'FRONT',
  showSideSwitch = true,
  className = '',
}: CardPreviewViewProps) {
  const [currentSide, setCurrentSide] = React.useState<CardSide>(initialSide);

  return (
    <View className={`w-full ${className}`}>
      {/* Side Switch Tabs */}
      {showSideSwitch && (
        <View className="mb-4 w-full flex-row rounded-2xl bg-neutral-200/60 p-1 dark:bg-neutral-800">
          <Pressable
            onPress={() => setCurrentSide('FRONT')}
            android_ripple={{ color: 'transparent' }}
            className={`flex-1 items-center justify-center rounded-xl py-2 ${
              currentSide === 'FRONT'
                ? 'bg-surface shadow-xs'
                : 'opacity-70'
            }`}
          >
            <Text
              className={`font-nunito text-xs font-black ${
                currentSide === 'FRONT'
                  ? 'text-mascot-navy dark:text-white'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {translate('cardRenderer.frontSide')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setCurrentSide('BACK')}
            android_ripple={{ color: 'transparent' }}
            className={`flex-1 items-center justify-center rounded-xl py-2 ${
              currentSide === 'BACK'
                ? 'bg-surface shadow-xs'
                : 'opacity-70'
            }`}
          >
            <Text
              className={`font-nunito text-xs font-black ${
                currentSide === 'BACK'
                  ? 'text-mascot-navy dark:text-white'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {translate('cardRenderer.backSide')}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Dynamic Card */}
      <DynamicCardRenderer
        template={template}
        schema={schema}
        frontSections={frontSections}
        backSections={backSections}
        data={data}
        side={currentSide}
        onFlip={setCurrentSide}
        isInteractive
        minHeight={380}
      />
    </View>
  );
}

export default CardPreviewView;

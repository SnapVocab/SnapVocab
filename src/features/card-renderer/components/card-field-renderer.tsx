import type { BuilderField } from '../types';
import type { TopicItemData } from '@/features/learn/types';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Image } from '@/components/ui/image';
import { Text } from '@/components/ui/text';
import { useTts } from '@/lib/hooks/use-tts';
import { FONT_SIZE_MAP } from '../types';
import { resolveFieldValue } from '../utils/data-resolver';

type Props = {
  field: BuilderField;
  data?: TopicItemData | Record<string, any> | null;
  instanceIndex?: number;
};

export function CardFieldRenderer({ field, data, instanceIndex = 0 }: Props) {
  const { text, isEmpty, isAudio, isImage } = resolveFieldValue(
    field,
    data,
    instanceIndex,
  );
  const { speak, isPlaying } = useTts();

  if (isEmpty && field.hideIfEmpty) {
    return null;
  }

  const fontSize = FONT_SIZE_MAP[field.fontSize] || 16;
  const textAlign = (field.alignment?.toLowerCase() || 'left') as 'left' | 'center' | 'right';
  const color = field.color || undefined;

  const isTargetWord = field.semanticRole === 'TARGET_WORD';
  const isPhonetic =
    field.attributeName?.toLowerCase().includes('phonetic') ||
    field.attributeName?.toLowerCase().includes('ipa') ||
    field.fieldLabel?.toLowerCase().includes('phiên âm') ||
    field.fieldLabel?.toLowerCase().includes('phonetic');
  const isTranslation = field.semanticRole === 'NATIVE_TRANSLATION';
  const isExample = field.semanticRole === 'EXAMPLE_SENTENCE';

  const handleSpeak = () => {
    if (text) {
      speak(text);
    }
  };

  // 1. Image field
  if (isImage && text) {
    return (
      <View className="my-2 w-full items-center justify-center overflow-hidden rounded-2xl">
        <Image
          source={{ uri: text }}
          className="h-44 w-full rounded-2xl"
          contentFit="cover"
        />
      </View>
    );
  }

  // 2. Audio or Text with audio action
  return (
    <View className="my-1 w-full">
      {/* Field Label (optional small subtitle) */}
      {field.fieldLabel && field.fieldLabel !== field.attributeName && !isTargetWord && (
        <Text className="mb-0.5 font-inter text-[11px] font-bold tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
          {field.fieldLabel}
        </Text>
      )}

      <View
        className="flex-row items-center gap-2"
        style={{
          justifyContent:
            textAlign === 'center'
              ? 'center'
              : textAlign === 'right'
                ? 'flex-end'
                : 'flex-start',
        }}
      >
        <Text
          style={[
            { fontSize, textAlign },
            color ? { color } : undefined,
          ]}
          className={`font-nunito ${
            isTargetWord
              ? 'font-black tracking-tight text-mascot-navy dark:text-white'
              : isPhonetic
                ? 'font-semibold text-neutral-500 dark:text-neutral-400'
                : isTranslation
                  ? 'font-extrabold text-lime-700 dark:text-lime-400'
                  : isExample
                    ? 'font-medium text-slate-700 italic dark:text-neutral-300'
                    : 'font-semibold text-neutral-800 dark:text-white'
          }`}
        >
          {text || (field.hideIfEmpty ? '' : '—')}
        </Text>

        {/* Audio Action Button */}
        {(field.audioAction || isAudio) && text ? (
          <Pressable
            onPress={handleSpeak}
            hitSlop={8}
            android_ripple={{ color: 'transparent' }}
            className={`size-8 items-center justify-center rounded-full shadow-xs active:scale-95 ${
              isPlaying
                ? 'bg-lime-500 text-white'
                : 'bg-lime-100/80 active:bg-lime-200 dark:bg-lime-950/60'
            }`}
          >
            <Text className="text-xs">🔊</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export default CardFieldRenderer;

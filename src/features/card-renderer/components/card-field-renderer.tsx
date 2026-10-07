import type { BuilderField, TopicItemData } from '../types';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { VolumeIcon } from '@/components/ui/icons';
import { Image } from '@/components/ui/image';
import { Text } from '@/components/ui/text';
import { useTts } from '@/lib/hooks/use-tts';
import { FONT_SIZE_MAP } from '../types';
import { extractGroups, resolveFieldValue } from '../utils/data-resolver';

type Props = {
  field: BuilderField;
  data?: TopicItemData | Record<string, any> | null;
  instanceIndex?: number;
};

export function CardFieldRenderer({ field, data, instanceIndex = 0 }: Props) {
  const { text, isEmpty, isImage } = resolveFieldValue(
    field,
    data,
    instanceIndex,
  );
  const { speak, isPlaying } = useTts();

  const groups = extractGroups(data);
  const targetWord = (groups.main as any)?.word || (data as any)?.word || '';

  const attrLower = (field.attributeName || '').toLowerCase();
  const isTargetWord = field.semanticRole === 'TARGET_WORD'
    || attrLower === 'word'
    || attrLower === 'target_word';
  const isPhonetic = field.attributeName?.toLowerCase().includes('phonetic')
    || field.attributeName?.toLowerCase().includes('ipa')
    || field.fieldLabel?.toLowerCase().includes('phiên âm')
    || field.fieldLabel?.toLowerCase().includes('phonetic');
  const isLevel = attrLower.includes('level')
    || attrLower.includes('cefr')
    || field.fieldLabel?.toLowerCase().includes('cấp độ');
  const isPos = attrLower.includes('pos')
    || attrLower.includes('partofspeech')
    || attrLower.includes('tag')
    || field.fieldLabel?.toLowerCase().includes('loại từ');
  const isTranslation = field.semanticRole === 'NATIVE_TRANSLATION'
    || attrLower.includes('trans')
    || attrLower.includes('nghia')
    || attrLower.includes('dich');
  const isDefinition = field.semanticRole === 'DEFINITION'
    || attrLower.includes('def')
    || field.fieldLabel?.toLowerCase().includes('định nghĩa');
  const isExample = field.semanticRole === 'EXAMPLE_SENTENCE'
    || attrLower.includes('example')
    || attrLower.includes('sentence');

  const handleSpeak = () => {
    const speakText = text || targetWord;
    if (speakText) {
      speak(speakText);
    }
  };

  const isDedicatedAudio
    = (field.dataType === 'AUDIO' || field.semanticRole === 'AUDIO')
      && !isTargetWord
      && !isPhonetic
      && !isTranslation;

  if (isEmpty && field.hideIfEmpty && !isDedicatedAudio) {
    return null;
  }

  const baseFontSize = FONT_SIZE_MAP[field.fontSize] || 16;
  const fontSize = isTargetWord
    ? Math.max(baseFontSize, 26)
    : isTranslation
      ? Math.max(baseFontSize, 20)
      : isPhonetic
        ? Math.max(baseFontSize, 15)
        : baseFontSize;

  const textAlign = (field.alignment?.toLowerCase() || 'left') as 'left' | 'center' | 'right';
  const color = field.color || undefined;

  // 1. Image field
  if (isImage && text) {
    return (
      <View className="my-2.5 w-full items-center justify-center overflow-hidden rounded-3xl border border-neutral-200/80 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
        <Image
          source={{ uri: text }}
          className="h-44 w-full rounded-3xl"
          contentFit="cover"
        />
      </View>
    );
  }

  // 2. Dedicated Audio Button
  if (isDedicatedAudio) {
    return (
      <View
        className="my-1.5 w-full flex-row"
        style={{
          justifyContent:
            textAlign === 'center'
              ? 'center'
              : textAlign === 'right'
                ? 'flex-end'
                : 'flex-start',
        }}
      >
        <Pressable
          onPress={handleSpeak}
          hitSlop={10}
          className={`flex-row items-center gap-2 rounded-2xl border px-3.5 py-2 shadow-2xs active:scale-95 ${
            isPlaying
              ? 'border-lime-500 bg-lime-500'
              : 'border-lime-200/90 bg-lime-50 active:bg-lime-100 dark:border-lime-900/60 dark:bg-lime-950/70'
          }`}
        >
          <VolumeIcon
            width={16}
            height={16}
            color={isPlaying ? '#FFFFFF' : '#4D7C0F'}
          />
          <Text
            className={`font-inter text-xs font-black ${
              isPlaying
                ? 'text-white'
                : 'text-lime-800 dark:text-lime-300'
            }`}
          >
            {field.fieldLabel || 'Nghe phát âm'}
          </Text>
        </Pressable>
      </View>
    );
  }

  // 3. Level Badge (e.g. A1, A2, B1, B2, C1, C2)
  if (isLevel && text) {
    return (
      <View
        className="my-1 w-full flex-row"
        style={{
          justifyContent:
            textAlign === 'center'
              ? 'center'
              : textAlign === 'right'
                ? 'flex-end'
                : 'flex-start',
        }}
      >
        <View className="flex-row items-center gap-1 rounded-full border border-emerald-200/90 bg-emerald-50/90 px-3 py-0.5 dark:border-emerald-900/60 dark:bg-emerald-950/60">
          <Text className="font-inter text-[11px] font-black tracking-wider text-emerald-700 uppercase dark:text-emerald-300">
            {text}
          </Text>
        </View>
      </View>
    );
  }

  // 4. Part of Speech Badge
  if (isPos && text) {
    return (
      <View
        className="my-1 w-full flex-row"
        style={{
          justifyContent:
            textAlign === 'center'
              ? 'center'
              : textAlign === 'right'
                ? 'flex-end'
                : 'flex-start',
        }}
      >
        <View className="rounded-xl border border-lime-200/80 bg-lime-100/70 px-3 py-1 dark:border-lime-900/60 dark:bg-lime-950/60">
          <Text className="font-inter text-xs font-black text-lime-800 dark:text-lime-300">
            {text}
          </Text>
        </View>
      </View>
    );
  }

  // 5. Definition Callout
  if (isDefinition && text) {
    return (
      <View className="my-2 w-full rounded-2xl border-l-4 border-lime-500 bg-lime-50/50 py-2.5 pr-3 pl-3.5 dark:bg-lime-950/30">
        {field.fieldLabel && field.fieldLabel !== field.attributeName && (
          <Text
            style={{ textAlign }}
            className="mb-0.5 font-inter text-[11px] font-bold tracking-wider text-lime-800 uppercase dark:text-lime-400"
          >
            {field.fieldLabel}
          </Text>
        )}
        <Text
          style={[
            { fontSize: Math.min(fontSize, 16), textAlign },
            color ? { color } : undefined,
          ]}
          className="font-inter font-medium text-slate-700 dark:text-neutral-200"
        >
          {text}
        </Text>
      </View>
    );
  }

  // 6. Example Sentence
  if (isExample && text) {
    return (
      <View className="my-1.5 w-full rounded-2xl border border-neutral-200/60 bg-slate-50/80 p-3.5 dark:border-neutral-800/80 dark:bg-neutral-900/50">
        <Text
          style={[
            { fontSize, textAlign },
            color ? { color } : undefined,
          ]}
          className="font-inter font-medium text-slate-800 italic dark:text-neutral-200"
        >
          &ldquo;
          {text}
          &rdquo;
        </Text>
      </View>
    );
  }

  // Formatted display text (for phonetic, wrap in /.../ if not already present)
  let displayText = text || (field.hideIfEmpty ? '' : '—');
  if (isPhonetic && text && !text.startsWith('/') && !text.startsWith('[')) {
    displayText = `/${text}/`;
  }

  // 7. Standard text / Word / Phonetic
  return (
    <View className="my-1 w-full">
      {/* Field Label (subtle caption) */}
      {field.fieldLabel
        && field.fieldLabel !== field.attributeName
        && !isTargetWord
        && !isPhonetic
        && !isLevel
        && !isTranslation && (
        <Text
          style={{ textAlign }}
          className="mb-0.5 font-inter text-[11px] font-bold tracking-wider text-neutral-400 uppercase dark:text-neutral-500"
        >
          {field.fieldLabel}
        </Text>
      )}

      <View
        className="flex-row items-center gap-2.5"
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
                ? 'font-bold text-sky-600 dark:text-sky-400'
                : isTranslation
                  ? 'font-black text-emerald-700 dark:text-emerald-400'
                  : 'font-semibold text-neutral-800 dark:text-white'
          }`}
        >
          {displayText}
        </Text>

        {/* Audio Action SVG Button on text fields like phonetic / word */}
        {field.audioAction && (
          <Pressable
            onPress={handleSpeak}
            hitSlop={10}
            android_ripple={{ color: 'transparent' }}
            className={`size-8 items-center justify-center rounded-full shadow-2xs active:scale-95 ${
              isPlaying
                ? 'bg-lime-500'
                : 'border border-lime-200/80 bg-lime-100/90 active:bg-lime-200 dark:border-lime-900/60 dark:bg-lime-950/80'
            }`}
          >
            <VolumeIcon
              width={15}
              height={15}
              color={isPlaying ? '#FFFFFF' : '#4D7C0F'}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default CardFieldRenderer;

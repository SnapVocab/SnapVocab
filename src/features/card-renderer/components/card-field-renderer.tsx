import type { BuilderField, TopicItemData } from '../types';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { useUniwind } from 'uniwind';
import { VolumeIcon } from '@/components/ui/icons';
import { Image } from '@/components/ui/image';
import { Text } from '@/components/ui/text';
import { useTts } from '@/lib/hooks/use-tts';
import { translate } from '@/lib/i18n';
import { FONT_SIZE_MAP } from '../types';
import { resolveFieldValue, resolveTargetWord } from '../utils/data-resolver';

type Props = {
  field: BuilderField;
  data?: TopicItemData | Record<string, any> | null;
  instanceIndex?: number;
  isRepeatableSection?: boolean;
};

/**
 * Normalizes phonetic string by cleanly stripping any outer slashes,
 * brackets, backslashes, quotes, whitespace
 */
type Rgb = [number, number, number];

function parseHex(hex: string): Rgb | null {
  const m = hex.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m)
    return null;
  const h = m[1].length === 3 ? m[1].replace(/./g, c => c + c) : m[1];
  return [0, 2, 4].map(i => Number.parseInt(h.slice(i, i + 2), 16)) as Rgb;
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
function luminance([r, g, b]: Rgb): number {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

// Card faces: white in light mode, the #22252B surface in dark mode.
const FACE_LUMINANCE = { light: 1, dark: 0.018 };
const TOWARD = { light: [0, 0, 0] as Rgb, dark: [255, 255, 255] as Rgb };

/**
 * A template picks one text color per field, usually against a white card. Keep its hue but move it
 * toward black (light) or white (dark) until it reaches 4.5:1 on the current card face, so a word
 * never fades into its own background in the other mode.
 */
function readableFieldColor(color: string | undefined, mode: 'light' | 'dark'): string | undefined {
  const rgb = color ? parseHex(color) : null;
  if (!color || !rgb)
    return color;
  const face = FACE_LUMINANCE[mode];
  const contrast = (c: Rgb) => {
    const l = luminance(c);
    return (Math.max(l, face) + 0.05) / (Math.min(l, face) + 0.05);
  };
  if (contrast(rgb) >= 4.5)
    return color;
  // A near-neutral ink (navy, slate) carries no hue worth keeping: the theme's own ink reads best.
  const chroma = (Math.max(...rgb) - Math.min(...rgb)) / 255;
  if (chroma < 0.25)
    return undefined;
  const target = TOWARD[mode];
  for (let t = 0.1; t <= 1; t += 0.1) {
    const mixed = rgb.map((v, i) => Math.round(v + (target[i] - v) * t)) as Rgb;
    if (contrast(mixed) >= 4.5)
      return `rgb(${mixed.join(', ')})`;
  }
  return undefined;
}

function cleanPhoneticString(raw?: string | null): string {
  if (!raw) {
    return '';
  }
  let s = raw.trim();
  // Strip outer enclosing slashes, brackets, backslashes, quotes
  while (
    s.length > 0
    && (s.startsWith('/')
      || s.startsWith('\\')
      || s.startsWith('[')
      || s.startsWith(']')
      || s.startsWith('"')
      || s.startsWith('\''))
  ) {
    s = s.slice(1).trim();
  }
  while (
    s.length > 0
    && (s.endsWith('/')
      || s.endsWith('\\')
      || s.endsWith('[')
      || s.endsWith(']')
      || s.endsWith('"')
      || s.endsWith('\''))
  ) {
    s = s.slice(0, -1).trim();
  }
  if (!s || s === 'null' || s === 'undefined') {
    return '';
  }
  return s;
}

export function CardFieldRenderer({
  field,
  data,
  instanceIndex = 0,
  isRepeatableSection = false,
}: Props) {
  const colorMode = useUniwind().theme === 'dark' ? 'dark' : 'light';
  const { text, isEmpty, isImage, isAudio } = resolveFieldValue(
    field,
    data,
    { instanceIndex, isRepeatableSection },
  );
  const { speak, isPlaying } = useTts();

  const targetWord = resolveTargetWord(data);

  const attrLower = (field.attributeName || '').toLowerCase();
  const labelLower = (field.fieldLabel || '').toLowerCase();

  const isTargetWord = field.semanticRole === 'TARGET_WORD'
    || attrLower === 'word'
    || attrLower === 'target_word';
  const isPhonetic = attrLower.includes('phonetic')
    || attrLower.includes('ipa')
    || labelLower.includes('phiên âm')
    || labelLower.includes('phonetic');

  const handleSpeak = () => {
    const speakText = (isTargetWord ? text : targetWord) || text;
    if (speakText) {
      speak(speakText);
    }
  };

  const isDedicatedAudio
    = (isAudio || field.dataType === 'AUDIO' || field.semanticRole === 'AUDIO')
      && !isTargetWord
      && !isPhonetic;

  // Clean phonetic: strip outer slashes/brackets/etc. cleanly
  const rawText = text?.trim() || '';
  const cleanPhonetic = isPhonetic ? cleanPhoneticString(rawText) : rawText;
  const isPhoneticEmpty = isPhonetic && !cleanPhonetic;
  const isFieldEmpty = isEmpty || isPhoneticEmpty;

  if (isFieldEmpty && field.hideIfEmpty && !isDedicatedAudio) {
    return null;
  }

  const fontSize = FONT_SIZE_MAP[field.fontSize] || 16;
  const textAlign = (field.alignment?.toLowerCase() || 'left') as 'left' | 'center' | 'right';
  const color = readableFieldColor(field.color || undefined, colorMode);

  const horizontalAlignClass
    = textAlign === 'center'
      ? 'items-center text-center'
      : textAlign === 'right'
        ? 'items-end text-right'
        : 'items-start text-left';

  const justifyContentStyle = {
    justifyContent:
      textAlign === 'center'
        ? 'center'
        : textAlign === 'right'
          ? 'flex-end'
          : 'flex-start',
  } as const;

  // 1. Image field
  if (isImage && text) {
    return (
      <View className={`my-1.5 w-full ${horizontalAlignClass}`}>
        {field.fieldLabel ? (
          <Text
            style={{ textAlign }}
            className="mb-1.5 font-inter text-[10.5px] font-extrabold tracking-wider text-neutral-400 uppercase dark:text-neutral-400"
          >
            {field.fieldLabel}
          </Text>
        ) : null}
        <View className="h-48 w-full overflow-hidden rounded-[22px] border border-line bg-neutral-100 p-1 dark:bg-neutral-800">
          <Image
            source={{ uri: text }}
            className="size-full rounded-[18px]"
            contentFit="cover"
          />
        </View>
      </View>
    );
  }

  // 2. Dedicated Audio Button
  if (isDedicatedAudio) {
    return (
      <View className="my-1.5 w-full" style={justifyContentStyle}>
        <Pressable
          onPress={handleSpeak}
          hitSlop={10}
          className={`flex-row items-center gap-2 rounded-2xl border-2 border-b-[3px] px-4 py-2.5 shadow-2xs active:translate-y-px active:border-b-2 ${
            isPlaying
              ? 'border-lime-500 bg-lime-500'
              : 'border-lime-200/90 border-b-lime-300 bg-lime-50 active:bg-lime-100 dark:border-lime-800 dark:border-b-lime-900 dark:bg-lime-950/70'
          }`}
        >
          <VolumeIcon
            width={18}
            height={18}
            color={isPlaying ? '#FFFFFF' : '#4D7C0F'}
          />
          <Text
            className={`font-nunito text-xs font-black tracking-wide ${
              isPlaying
                ? 'text-white'
                : 'text-lime-800 dark:text-lime-300'
            }`}
          >
            {field.fieldLabel || translate('cardRenderer.playPronunciation')}
          </Text>
        </Pressable>
      </View>
    );
  }

  // Formatted display text (for phonetic, properly format /IPA/)
  let displayText = text || (field.hideIfEmpty ? '' : '—');
  if (isPhonetic) {
    if (cleanPhonetic) {
      displayText = `/${cleanPhonetic}/`;
    }
    else {
      displayText = field.hideIfEmpty ? '' : '—';
    }
  }

  // 3. Standard dynamic text field (Word, Translation, Phonetic, Level, Definition, Example, etc.)
  return (
    <View className={`my-1.5 w-full ${horizontalAlignClass}`}>
      {/* Field Label (Frappe-style subtle uppercase caption) */}
      {field.fieldLabel ? (
        <Text
          style={{ textAlign }}
          className={`mb-1 font-inter text-[10px] font-bold tracking-[1px] uppercase ${isTargetWord ? 'text-primary-700 dark:text-primary-300' : 'text-neutral-400 dark:text-neutral-400'}`}
        >
          {field.fieldLabel}
        </Text>
      ) : null}

      <View
        className="w-full flex-row items-center gap-2.5"
        style={justifyContentStyle}
      >
        <Text
          style={[
            { fontSize, textAlign },
            color ? { color } : undefined,
          ]}
          className={`shrink ${
            isPhonetic
              ? 'font-sans font-semibold tracking-wide text-sky-600 dark:text-sky-400'
              : isTargetWord
                ? 'font-nunito font-black tracking-tight text-mascot-navy dark:text-white'
                : 'font-nunito font-bold text-neutral-800 dark:text-white'
          }`}
        >
          {displayText}
        </Text>

        {/* Audio Action SVG Button on text fields like phonetic / word */}
        {field.audioAction && (displayText || targetWord) ? (
          <Pressable
            onPress={handleSpeak}
            hitSlop={10}
            className={`size-8 items-center justify-center rounded-full border-2 border-b-[3px] shadow-2xs active:translate-y-px active:border-b-2 ${
              isPlaying
                ? 'border-lime-600 bg-lime-500'
                : 'border-lime-300 border-b-lime-400 bg-lime-100 active:bg-lime-200 dark:border-lime-800 dark:border-b-lime-900 dark:bg-lime-950/80'
            }`}
          >
            <VolumeIcon
              width={15}
              height={15}
              color={isPlaying ? '#FFFFFF' : '#4D7C0F'}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export default CardFieldRenderer;

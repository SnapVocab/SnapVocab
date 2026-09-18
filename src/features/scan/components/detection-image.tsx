import type { ImageLoadEventData } from 'expo-image';
import type { LayoutChangeEvent } from 'react-native';
import type { Rect, Size } from '../box-layout';
import type { ScanResult } from '../types';
import { useMemo, useState } from 'react';
import { Pressable } from 'react-native';
import { Image, Text, View } from '@/components/ui';
import { containRect, mapBox } from '../box-layout';
import { boxColor } from '../display';

type Props = {
  imageUri: string;
  /** Absent while the scan is still running: the photo is shown without boxes. */
  result?: ScanResult | null;
  selectedIndex?: number | null;
  onSelect?: (index: number) => void;
};

const MIN_HEIGHT = 220;
const MAX_HEIGHT = 480;
const LABEL_HEIGHT = 18;

/**
 * The user's own photo with every detected box drawn on top, each in its own
 * colour with the word on a tag, so boxes can be told apart and matched to the
 * cards below. The backend returns boxes in an EXIF-upright, resized space
 * (imageWidth x imageHeight) and the photo is displayed upright too, so a
 * plain ratio maps one onto the other.
 */
export function DetectionImage({ imageUri, result, selectedIndex, onSelect }: Props) {
  const [width, setWidth] = useState(0);
  const [loaded, setLoaded] = useState<Size | null>(null);

  // Size the frame to the photo's own aspect ratio (result first, else the
  // decoded file) so it is not letterboxed inside a fixed box.
  const aspect = result
    ? result.imageHeight / result.imageWidth
    : loaded ? loaded.height / loaded.width : 1;
  const height = width > 0
    ? Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, width * aspect))
    : MIN_HEIGHT;

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  const onLoad = (event: ImageLoadEventData) =>
    setLoaded({ width: event.source.width, height: event.source.height });

  const boxes = useMemo(() => {
    if (!result || width === 0)
      return [];
    const image = { width: result.imageWidth, height: result.imageHeight };
    const shown = containRect(image, { width, height });
    return result.items.map((item, index) => ({
      item,
      index,
      color: boxColor(index),
      rect: mapBox(item.box, image, shown),
    }));
  }, [result, width, height]);

  const tags = useMemo(() => placeTags(boxes, width), [boxes, width]);

  // Draw the selected box last so its tag is never hidden under another.
  const ordered = selectedIndex == null
    ? boxes
    : [
        ...boxes.filter(b => b.index !== selectedIndex),
        ...boxes.filter(b => b.index === selectedIndex),
      ];

  return (
    <View
      onLayout={onLayout}
      style={{ height }}
      className="w-full overflow-hidden rounded-3xl bg-neutral-900"
    >
      <Image
        source={{ uri: imageUri }}
        contentFit="contain"
        onLoad={onLoad}
        style={{ width: '100%', height: '100%' }}
      />

      {/* Boxes first, then every tag in a layer above them: a tag is never
          covered by a neighbouring box or cut to the width of a narrow box. */}
      {ordered.map(({ index, color, rect }) => {
        const selected = selectedIndex === index;
        return (
          <Pressable
            key={`box-${index}`}
            onPress={() => onSelect?.(index)}
            testID={`scan-box-${index}`}
            hitSlop={4}
            style={{
              position: 'absolute',
              ...rect,
              borderWidth: selected ? 3 : 2,
              borderColor: color,
              borderRadius: 6,
              backgroundColor: selected ? `${color}33` : 'transparent',
            }}
          />
        );
      })}

      {tags.map(tag => (
        <Pressable
          key={`tag-${tag.index}`}
          onPress={() => onSelect?.(tag.index)}
          style={{
            position: 'absolute',
            top: tag.top,
            left: tag.left,
            height: LABEL_HEIGHT,
            maxWidth: width - tag.left,
            backgroundColor: tag.color,
            zIndex: selectedIndex === tag.index ? 2 : 1,
          }}
          className={`justify-center px-1.5 ${tag.above ? 'rounded-t-md' : 'rounded-b-md'}`}
        >
          <Text numberOfLines={1} className="text-[11px]/[14px] font-bold text-white">
            {tag.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

type PlacedBox = { item: ScanResult['items'][number]; index: number; color: string; rect: Rect };
type Tag = {
  index: number;
  label: string;
  color: string;
  left: number;
  top: number;
  above: boolean;
};

/** Rough rendered width of an 11px bold tag; enough to detect overlaps. */
function tagWidth(label: string) {
  return label.length * 6.6 + 14;
}

/**
 * Puts each tag on top of its box (or just inside when the box touches the top
 * edge), flipping to the box's right edge near the photo's right side. When a
 * tag would cover one already placed, it steps down inside its box instead of
 * stacking on it, so neighbouring words stay readable.
 */
function placeTags(boxes: PlacedBox[], width: number): Tag[] {
  const placed: { left: number; top: number; right: number; bottom: number }[] = [];
  const overlaps = (left: number, top: number, w: number) =>
    placed.some(p =>
      left < p.right && left + w > p.left && top < p.bottom && top + LABEL_HEIGHT > p.top);

  return boxes.map(({ item, index, color, rect }) => {
    const w = Math.min(tagWidth(item.label), width);
    const left = Math.max(0, Math.min(rect.left, width - w));
    let above = rect.top >= LABEL_HEIGHT;
    let top = above ? rect.top - LABEL_HEIGHT + 2 : rect.top;
    for (let step = 0; step < 4 && overlaps(left, top, w); step++) {
      above = false;
      top = rect.top + step * LABEL_HEIGHT + (step === 0 ? 0 : 2);
    }
    placed.push({ left, top, right: left + w, bottom: top + LABEL_HEIGHT });
    return { index, label: item.label, color, left, top, above };
  });
}

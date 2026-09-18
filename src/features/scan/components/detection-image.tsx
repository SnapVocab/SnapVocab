import type { LayoutChangeEvent } from 'react-native';
import type { Size } from '../box-layout';
import type { ScanResult } from '../types';
import { useMemo, useState } from 'react';
import { Pressable } from 'react-native';
import { Image, Text, View } from '@/components/ui';
import { SparklesIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';
import { containRect, mapBox } from '../box-layout';
import { RELIABILITY_COLORS } from '../display';

type Props = {
  imageUri: string;
  /** Absent while the scan is still running: the photo is shown without boxes. */
  result?: ScanResult | null;
  selectedIndex?: number | null;
  onSelect?: (index: number) => void;
};

const HEIGHT = 260;

/**
 * The user's own photo with the detected boxes drawn on top. The backend returns
 * boxes in an EXIF-upright, resized space (imageWidth x imageHeight), and the
 * photo is displayed upright too, so a plain ratio maps one onto the other.
 */
export function DetectionImage({ imageUri, result, selectedIndex, onSelect }: Props) {
  const [container, setContainer] = useState<Size>({ width: 0, height: 0 });

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainer({ width, height });
  };

  const boxes = useMemo(() => {
    if (!result || container.width === 0)
      return [];
    const image = { width: result.imageWidth, height: result.imageHeight };
    const shown = containRect(image, container);
    return result.items.map(item => ({ item, rect: mapBox(item.box, image, shown) }));
  }, [result, container]);

  return (
    <View
      onLayout={onLayout}
      style={{ height: HEIGHT }}
      className="w-full overflow-hidden rounded-[28px] border-2 border-white bg-neutral-900"
    >
      <Image source={{ uri: imageUri }} contentFit="contain" style={{ width: '100%', height: '100%' }} />

      {boxes.map(({ item, rect }, index) => {
        const color = RELIABILITY_COLORS[item.reliability];
        const selected = selectedIndex === index;
        return (
          <Pressable
            // eslint-disable-next-line react/no-array-index-key -- fixed order per result
            key={index}
            onPress={() => onSelect?.(index)}
            testID={`scan-box-${index}`}
            style={{
              position: 'absolute',
              ...rect,
              borderWidth: selected ? 3 : 1.5,
              borderColor: color,
              borderRadius: 8,
              backgroundColor: selected ? `${color}33` : 'transparent',
              zIndex: selected ? 2 : 1,
            }}
          >
            {selected && (
              <View style={{ backgroundColor: color }} className="self-start rounded-br-lg px-2 py-0.5">
                <Text className="text-[10px] font-bold text-white">{item.label}</Text>
              </View>
            )}
          </Pressable>
        );
      })}

      {result && (
        <View className="absolute top-3 left-3 flex-row items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-3.5 py-1.5">
          <SparklesIcon color="#7DD634" />
          <Text className="font-nunito text-xs font-bold text-white">
            {translate('scan.result.found', { count: result.items.length })}
          </Text>
        </View>
      )}
    </View>
  );
}

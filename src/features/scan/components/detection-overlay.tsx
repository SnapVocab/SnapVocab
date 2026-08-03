import type { LayoutChangeEvent } from 'react-native';
import type { ScanItem } from '../api';
import type { ScanPhoto } from '../use-scan-store';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Image, Text, View } from '@/components/ui';

const BOX_COLORS = ['#8b5cf6', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444'];

type DetectionOverlayProps = {
  photo: ScanPhoto;
  results: ScanItem[];
  showBoxes: boolean;
};

export function DetectionOverlay({ photo, results, showBoxes }: DetectionOverlayProps) {
  const [containerWidth, setContainerWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  // Container width matches the photo's own aspect ratio, so the rendered
  // image has no letterboxing — a single scale factor maps original pixel
  // coordinates (from the AI service, in the photo's native resolution) to
  // on-screen coordinates.
  const scale = containerWidth > 0 ? containerWidth / photo.width : 0;

  return (
    <View
      style={{ aspectRatio: photo.width / photo.height }}
      className="w-full overflow-hidden bg-black"
      onLayout={onLayout}
    >
      <Image
        source={{ uri: photo.uri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        alt="Scanned photo"
      />

      {showBoxes && scale > 0 && results.map((item, index) => {
        const color = BOX_COLORS[index % BOX_COLORS.length];
        const left = item.box.x1 * scale;
        const top = item.box.y1 * scale;
        const width = (item.box.x2 - item.box.x1) * scale;
        const height = (item.box.y2 - item.box.y1) * scale;
        const labelTop = Math.max(4, top - 26);

        return (
          <View key={`${item.label}-${item.box.x1}-${item.box.y1}`}>
            <View
              pointerEvents="none"
              style={{ position: 'absolute', left, top, width, height, borderColor: color }}
              className="rounded-xl border-2"
            />
            <View
              pointerEvents="none"
              style={{ position: 'absolute', left, top: labelTop, backgroundColor: color }}
              className="rounded-full px-2 py-0.5"
            >
              <Text className="text-xs font-bold text-white capitalize">
                {item.label}
                {' '}
                {Math.round(item.score * 100)}
                %
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

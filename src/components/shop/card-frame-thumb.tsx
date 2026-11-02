import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from '@/components/ui/image';
import { CARD_FRAME_ASPECT, CARD_FRAME_WINDOW, CARD_FRAME_WINDOW_RADIUS } from '@/features/card-renderer/card-frame';

/** A small 3:4 flashcard wearing the frame, for Shop and Kho đồ tiles (card_frame_plan.md §3). */
export function CardFrameThumb({ frameUrl, height, onFrameError }: { frameUrl?: string | null; height: number; onFrameError?: () => void }) {
  const [failed, setFailed] = React.useState(false);
  const width = height * CARD_FRAME_ASPECT;
  return (
    <View style={{ width, height }}>
      <View
        style={{
          position: 'absolute',
          left: width * CARD_FRAME_WINDOW.x,
          top: height * CARD_FRAME_WINDOW.y,
          width: width * CARD_FRAME_WINDOW.width,
          height: height * CARD_FRAME_WINDOW.height,
          borderRadius: width * CARD_FRAME_WINDOW_RADIUS,
        }}
        className="items-center justify-center border border-line bg-surface"
      >
        <Text style={{ fontSize: height * 0.13 }} className="font-nunito font-black text-mascot-navy dark:text-white">Aa</Text>
      </View>
      {frameUrl && !failed && (
        <Image
          source={{ uri: frameUrl }}
          style={StyleSheet.absoluteFillObject}
          contentFit="fill"
          placeholder={null}
          pointerEvents="none"
          onError={() => {
            setFailed(true);
            onFrameError?.();
          }}
        />
      )}
    </View>
  );
}

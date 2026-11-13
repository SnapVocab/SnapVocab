import type { BadgeItem } from '../types';
import * as React from 'react';
import { View } from 'react-native';
import { LockIcon } from '@/components/ui/icons';
import { Image } from '@/components/ui/image';

/** Badge art (MinIO URL) at `size`; not-yet-earned badges are dimmed under a padlock. */
export function BadgeImage({ item, size }: { item: BadgeItem; size: number }) {
  // The presigned query changes on every fetch; the object path alone identifies the art.
  const uri = item.imageUrl;
  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      {uri && (
        <Image
          source={{ uri, cacheKey: uri.split('?')[0] }}
          placeholder={null}
          contentFit="contain"
          style={{ width: size, height: size, opacity: item.earned ? 1 : 0.35 }}
        />
      )}
      {!item.earned && (
        <View pointerEvents="none" className="absolute size-9 items-center justify-center rounded-full border border-white/50 bg-black/60">
          <LockIcon width={16} height={16} color="#FFFFFF" />
        </View>
      )}
    </View>
  );
}

export function ProgressBar({ percent, className }: { percent: number; className: string }) {
  return (
    <View className={`w-full overflow-hidden rounded-full border border-neutral-200/60 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 ${className}`}>
      <View className="h-full rounded-full bg-primary-500" style={{ width: `${Math.min(100, percent)}%` }} />
    </View>
  );
}

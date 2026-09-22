import type { StyleProp, ViewStyle } from 'react-native';
import * as React from 'react';
import { View } from 'react-native';
import { Image } from './image';
import { Text } from './text';

export type UserAvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export type UserAvatarProps = {
  url?: string | null;
  name?: string | null;
  size?: UserAvatarSize | number;
  bordered?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

const SIZE_MAP: Record<UserAvatarSize, { containerSize: number; textSizeClass: string; borderClass: string }> = {
  sm: { containerSize: 32, textSizeClass: 'text-xs', borderClass: 'border-[1.5px]' },
  md: { containerSize: 40, textSizeClass: 'text-sm', borderClass: 'border-2' },
  lg: { containerSize: 56, textSizeClass: 'text-xl', borderClass: 'border-2' },
  xl: { containerSize: 80, textSizeClass: 'text-3xl', borderClass: 'border-[3px]' },
};

export function UserAvatar({
  url,
  name,
  size = 'md',
  bordered = false,
  className = '',
  style,
}: UserAvatarProps) {
  const initial = (name?.[0] ?? 'U').toUpperCase();

  const isPresetSize = typeof size === 'string';
  const sizeConfig = isPresetSize ? SIZE_MAP[size] : null;
  const dimension = isPresetSize ? sizeConfig!.containerSize : size;
  const textSizeClass = isPresetSize
    ? sizeConfig!.textSizeClass
    : dimension >= 64
      ? 'text-3xl'
      : dimension >= 48
        ? 'text-xl'
        : dimension >= 36
          ? 'text-sm'
          : 'text-xs';

  const borderClass = bordered
    ? isPresetSize
      ? `${sizeConfig!.borderClass} border-primary-500`
      : 'border-2 border-primary-500'
    : '';

  return (
    <View
      style={[{ width: dimension, height: dimension, borderRadius: dimension / 2 }, style]}
      className={`dark:bg-primary-950/70 items-center justify-center overflow-hidden rounded-full bg-primary-100 ${borderClass} ${className}`}
    >
      {url ? (
        <Image
          source={{ uri: url }}
          className="size-full rounded-full"
          contentFit="cover"
        />
      ) : (
        <Text className={`font-black text-primary-600 dark:text-primary-400 ${textSizeClass}`}>
          {initial}
        </Text>
      )}
    </View>
  );
}

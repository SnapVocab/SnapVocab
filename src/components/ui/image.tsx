/* eslint-disable react-refresh/only-export-components */
import type { ImageProps } from 'expo-image';
import { Image as NImage } from 'expo-image';
import * as React from 'react';
import { withUniwind } from 'uniwind';
import { normalizeUrl } from '@/lib/storage/url';

export type ImgProps = ImageProps & {
  className?: string;
};

const StyledImage = withUniwind(NImage);

export function Image({
  style,
  className,
  placeholder = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4',
  source,
  ...props
}: ImgProps) {
  const normalizedSource = typeof source === 'object' && source !== null && 'uri' in source && source.uri
    ? { ...source, uri: normalizeUrl(source.uri) }
    : source;

  return (
    <StyledImage
      className={className}
      placeholder={placeholder}
      style={style}
      source={normalizedSource}
      {...props}
    />
  );
}

export function preloadImages(sources: string[]) {
  NImage.prefetch(sources);
}

import type { Mnemonic } from '../mnemonic-api';
import * as React from 'react';
import { Text as NativeText } from 'react-native';
import { Text } from '@/components/ui';
import { useColorMode } from '@/components/ui/surface';

type Props = { mnemonic: Pick<Mnemonic, 'content' | 'keyword'>; className?: string; numberOfLines?: number };

/** The mnemonic with its Vietnamese hook (keyword) in bold, the part the learner should picture. */
export function MnemonicText({ mnemonic, className, numberOfLines }: Props) {
  const isDark = useColorMode() === 'dark';
  const { content, keyword } = mnemonic;
  const at = keyword ? content.toLowerCase().indexOf(keyword.toLowerCase()) : -1;
  if (!keyword || at < 0)
    return <Text className={className} numberOfLines={numberOfLines}>{content}</Text>;
  return (
    <Text className={className} numberOfLines={numberOfLines}>
      {content.slice(0, at)}
      {/* A plain nested Text inherits the line's size; the UI Text would reset it to text-base. */}
      <NativeText style={{ fontWeight: '900', color: isDark ? '#FCD34D' : '#B45309' }}>
        {content.slice(at, at + keyword.length)}
      </NativeText>
      {content.slice(at + keyword.length)}
    </Text>
  );
}

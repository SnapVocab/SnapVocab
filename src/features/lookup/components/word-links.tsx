import type { Meaning } from '../types';
import * as React from 'react';
import { Linking, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui';
import { ExternalLinkIcon } from '@/components/ui/icons';

export type WordLinksProps = {
  meanings?: Meaning[];
};

export function WordLinks({ meanings }: WordLinksProps) {
  const allLinks = React.useMemo(() => {
    if (!meanings)
      return [];
    const set = new Set<string>();
    meanings.forEach((m) => {
      m.links?.forEach((link) => {
        if (link && link.trim()) {
          set.add(link.trim());
        }
      });
    });
    return Array.from(set);
  }, [meanings]);

  if (allLinks.length === 0) {
    return null;
  }

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch((err) => {
      console.warn('Cannot open link:', url, err);
    });
  };

  return (
    <View className="mb-6">
      <Text className="mb-3 font-nunito text-base font-black text-mascot-navy dark:text-white">
        Tài liệu & Liên kết
      </Text>

      <View className="flex-row flex-wrap gap-2">
        {allLinks.map((link, idx) => (
          <TouchableOpacity
            key={`link-${idx}-${link.slice(0, 15)}`}
            onPress={() => handleOpenLink(link)}
            activeOpacity={0.7}
            className="flex-row items-center gap-1.5 rounded-2xl border border-neutral-200 bg-neutral-50 px-3.5 py-2 active:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
          >
            <ExternalLinkIcon color="#64748B" width={14} height={14} />
            <Text className="font-inter text-xs font-semibold text-neutral-600 dark:text-neutral-300">
              {link.replace(/^https?:\/\/(www\.)?/, '').slice(0, 30)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

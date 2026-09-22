import type { RelationLookup } from '../types';
import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui';
import { translate } from '@/lib/i18n/utils';

export type WordRelationsProps = {
  relations?: RelationLookup[];
  onSelectRelation?: (word: string) => void;
};

export function WordRelations({
  relations,
  onSelectRelation,
}: WordRelationsProps) {
  const { synonyms, antonyms, wordFamily } = React.useMemo(() => {
    const syns: RelationLookup[] = [];
    const ants: RelationLookup[] = [];
    const fams: RelationLookup[] = [];

    relations?.forEach((rel) => {
      const type = (rel.relationType || '').toLowerCase();
      if (type.includes('synonym') || type.includes('đồng nghĩa')) {
        syns.push(rel);
      }
      else if (type.includes('antonym') || type.includes('trái nghĩa')) {
        ants.push(rel);
      }
      else {
        fams.push(rel);
      }
    });

    return {
      synonyms: syns,
      antonyms: ants,
      wordFamily: fams,
    };
  }, [relations]);

  const hasRelations
    = synonyms.length > 0 || antonyms.length > 0 || wordFamily.length > 0;

  if (!hasRelations) {
    return null;
  }

  return (
    <View className="mb-6">
      <Text className="mb-3 font-nunito text-base font-black text-mascot-navy dark:text-white">
        {translate('word_detail.related_words')}
      </Text>

      {/* Đồng nghĩa */}
      {synonyms.length > 0 && (
        <View className="mb-3.5">
          <Text className="mb-2 font-inter text-xs font-bold text-neutral-500 dark:text-neutral-400">
            {translate('word_detail.synonyms')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {synonyms.map((rel, i) => (
              <TouchableOpacity
                key={`syn-${rel.relatedWord}-${i}`}
                onPress={() => onSelectRelation?.(rel.relatedWord)}
                activeOpacity={0.7}
                className="rounded-2xl border border-neutral-200 bg-white px-3.5 py-2 active:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:active:bg-neutral-700"
              >
                <Text className="font-inter text-sm font-semibold text-slate-700 dark:text-neutral-200">
                  {rel.relatedWord}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Trái nghĩa */}
      {antonyms.length > 0 && (
        <View className="mb-3.5">
          <Text className="mb-2 font-inter text-xs font-bold text-neutral-500 dark:text-neutral-400">
            {translate('word_detail.antonyms')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {antonyms.map((rel, i) => (
              <TouchableOpacity
                key={`ant-${rel.relatedWord}-${i}`}
                onPress={() => onSelectRelation?.(rel.relatedWord)}
                activeOpacity={0.7}
                className="rounded-2xl border border-neutral-200 bg-white px-3.5 py-2 active:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:active:bg-neutral-700"
              >
                <Text className="font-inter text-sm font-semibold text-slate-700 dark:text-neutral-200">
                  {rel.relatedWord}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Từ cùng gốc */}
      {wordFamily.length > 0 && (
        <View className="mb-3.5">
          <Text className="mb-2 font-inter text-xs font-bold text-neutral-500 dark:text-neutral-400">
            {translate('word_detail.word_family')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {wordFamily.map((rel, i) => (
              <TouchableOpacity
                key={`fam-${rel.relatedWord}-${i}`}
                onPress={() => onSelectRelation?.(rel.relatedWord)}
                activeOpacity={0.7}
                className="rounded-2xl border border-neutral-200 bg-white px-3.5 py-2 active:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:active:bg-neutral-700"
              >
                <Text className="font-inter text-sm font-semibold text-slate-700 dark:text-neutral-200">
                  {rel.relatedWord}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

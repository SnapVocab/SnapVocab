import { View } from 'react-native';
import { Button, Text } from '@/components/ui';
import { AccuracyIcon, FlameIcon, FlashcardIcon, FolderIcon, PlayIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';

type Props = {
  name: string;
  translation?: string;
  type?: 'SYSTEM' | 'USER';
  totalWords?: number;
  masteredWords?: number;
  learningWords?: number;
  onStudyPress?: () => void;
};

export default function CollectionDetailHero({
  name,
  translation,
  type = 'USER',
  totalWords = 0,
  masteredWords = 0,
  learningWords = 0,
  onStudyPress,
}: Props) {
  const isSystem = type === 'SYSTEM';

  return (
    <View className="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      {/* Top row: Folder Icon + Collection Info + Type Badge */}
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-3.5">
          <View className="size-14 items-center justify-center rounded-2xl border border-lime-200 bg-lime-50 dark:border-lime-900/60 dark:bg-lime-950/40">
            <FolderIcon width={28} height={28} color="#65A30D" />
          </View>

          <View className="flex-1">
            <Text
              className="font-nunito text-xl font-black text-mascot-navy dark:text-white"
              numberOfLines={2}
            >
              {name}
            </Text>
            {translation
              ? (
                  <Text
                    className="mt-0.5 font-inter text-sm font-medium text-neutral-500 dark:text-neutral-400"
                    numberOfLines={2}
                  >
                    {translation}
                  </Text>
                )
              : null}
          </View>
        </View>

        {/* Type Badge */}
        <View
          className={`rounded-full px-2.5 py-1 ${
            isSystem
              ? 'border border-blue-200 bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/40'
              : 'border border-lime-200 bg-lime-50 dark:border-lime-900/60 dark:bg-lime-950/40'
          }`}
        >
          <Text
            className={`font-nunito text-xs font-bold ${
              isSystem
                ? 'text-blue-700 dark:text-blue-300'
                : 'text-lime-700 dark:text-lime-400'
            }`}
          >
            {isSystem
              ? translate('learn.collections.system')
              : translate('learn.collections.mine')}
          </Text>
        </View>
      </View>

      {/* Stats row */}
      <View className="mt-4 flex-row items-center justify-between gap-2.5 rounded-2xl bg-neutral-50 p-3 dark:bg-neutral-800/60">
        {/* Total Cards */}
        <View className="flex-1 items-center">
          <View className="flex-row items-center gap-1">
            <FlashcardIcon width={14} height={14} color="#71717A" />
            <Text className="font-nunito text-base font-extrabold text-mascot-navy dark:text-white">
              {totalWords}
            </Text>
          </View>
          <Text className="mt-0.5 font-inter text-[11px] font-medium text-neutral-400">
            {translate('learn.collection_detail.stat_total')}
          </Text>
        </View>

        <View className="h-6 w-px bg-neutral-200 dark:bg-neutral-700" />

        {/* Learning Cards */}
        <View className="flex-1 items-center">
          <View className="flex-row items-center gap-1">
            <FlameIcon width={14} height={14} color="#F59E0B" />
            <Text className="font-nunito text-base font-extrabold text-amber-500">
              {learningWords}
            </Text>
          </View>
          <Text className="mt-0.5 font-inter text-[11px] font-medium text-neutral-400">
            {translate('learn.collection_detail.stat_learning')}
          </Text>
        </View>

        <View className="h-6 w-px bg-neutral-200 dark:bg-neutral-700" />

        {/* Mastered Cards */}
        <View className="flex-1 items-center">
          <View className="flex-row items-center gap-1">
            <AccuracyIcon width={14} height={14} color="#10B981" />
            <Text className="font-nunito text-base font-extrabold text-emerald-600 dark:text-emerald-400">
              {masteredWords}
            </Text>
          </View>
          <Text className="mt-0.5 font-inter text-[11px] font-medium text-neutral-400">
            {translate('learn.collection_detail.stat_mastered')}
          </Text>
        </View>
      </View>

      {/* Study Action CTA */}
      <View className="mt-4">
        <Button
          label={translate('learn.collection_detail.study_now')}
          icon={<PlayIcon width={16} height={16} fill="#FFFFFF" />}
          onPress={onStudyPress}
        />
      </View>
    </View>
  );
}

export { CollectionDetailHero };

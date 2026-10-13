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
  const progressPercent = totalWords > 0 ? Math.min(100, Math.round((masteredWords / totalWords) * 100)) : 0;

  return (
    <View className="dark:border-neutral-750 dark:border-b-neutral-850 rounded-3xl border-2 border-b-4 border-neutral-200/90 border-b-neutral-300 bg-white p-5 shadow-xs dark:bg-neutral-900">
      {/* Top row: Folder Icon + Collection Info + Type Badge */}
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-3.5">
          <View
            className={`size-14 items-center justify-center rounded-2xl border-2 border-b-4 ${
              isSystem
                ? 'border-sky-300 border-b-sky-400 bg-sky-100/90 dark:border-sky-800 dark:border-b-sky-900 dark:bg-sky-950/60'
                : 'border-lime-300 border-b-lime-400 bg-lime-100/90 dark:border-lime-800 dark:border-b-lime-900 dark:bg-lime-950/60'
            }`}
          >
            <FolderIcon
              width={28}
              height={28}
              color={isSystem ? '#0284C7' : '#65A30D'}
            />
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
              ? 'border border-sky-200 bg-sky-50 dark:border-sky-900/60 dark:bg-sky-950/40'
              : 'border border-lime-200 bg-lime-50 dark:border-lime-900/60 dark:bg-lime-950/40'
          }`}
        >
          <Text
            className={`font-nunito text-xs font-black uppercase ${
              isSystem
                ? 'text-sky-700 dark:text-sky-300'
                : 'text-lime-700 dark:text-lime-400'
            }`}
          >
            {isSystem
              ? translate('learn.collections.system')
              : translate('learn.collections.mine')}
          </Text>
        </View>
      </View>

      {/* Progress bar with glossy Duolingo feel */}
      {totalWords > 0 && (
        <View className="mt-4">
          <View className="mb-1.5 flex-row items-center justify-between">
            <Text className="font-nunito text-[11px] font-black tracking-wider text-neutral-400 uppercase">
              {translate('learn.collection_detail.progress_title')}
            </Text>
            <Text className="font-nunito text-[12px] font-black text-primary-600 dark:text-primary-400">
              {progressPercent}
              %
            </Text>
          </View>
          <View className="h-3 overflow-hidden rounded-full border border-neutral-200/80 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800">
            <View
              className="h-full rounded-full bg-primary-500"
              style={{ width: `${progressPercent}%` }}
            >
              {/* Gloss highlight streak */}
              <View className="mx-1 mt-0.5 h-1 rounded-full bg-white/40" />
            </View>
          </View>
        </View>
      )}

      {/* Stats row */}
      <View className="mt-4 flex-row items-center justify-between gap-2.5 rounded-2xl border border-neutral-200/80 bg-neutral-50/80 p-3 dark:border-neutral-700/80 dark:bg-neutral-800/60">
        {/* Total Cards */}
        <View className="flex-1 items-center">
          <View className="flex-row items-center gap-1.5">
            <FlashcardIcon width={15} height={15} color="#71717A" />
            <Text className="font-nunito text-base font-black text-mascot-navy dark:text-white">
              {totalWords}
            </Text>
          </View>
          <Text className="mt-0.5 font-inter text-[11px] font-bold text-neutral-400">
            {translate('learn.collection_detail.stat_total')}
          </Text>
        </View>

        <View className="h-6 w-px bg-neutral-200 dark:bg-neutral-700" />

        {/* Learning Cards */}
        <View className="flex-1 items-center">
          <View className="flex-row items-center gap-1.5">
            <FlameIcon width={15} height={15} color="#F59E0B" />
            <Text className="font-nunito text-base font-black text-amber-500">
              {learningWords}
            </Text>
          </View>
          <Text className="mt-0.5 font-inter text-[11px] font-bold text-neutral-400">
            {translate('learn.collection_detail.stat_learning')}
          </Text>
        </View>

        <View className="h-6 w-px bg-neutral-200 dark:bg-neutral-700" />

        {/* Mastered Cards */}
        <View className="flex-1 items-center">
          <View className="flex-row items-center gap-1.5">
            <AccuracyIcon width={15} height={15} color="#10B981" />
            <Text className="font-nunito text-base font-black text-emerald-600 dark:text-emerald-400">
              {masteredWords}
            </Text>
          </View>
          <Text className="mt-0.5 font-inter text-[11px] font-bold text-neutral-400">
            {translate('learn.collection_detail.stat_mastered')}
          </Text>
        </View>
      </View>

      {/* Study Action CTA */}
      <View className="mt-4">
        <Button
          label={translate('learn.collection_detail.study_now')}
          variant="primary"
          size="default"
          icon={<PlayIcon width={16} height={16} fill="#FFFFFF" />}
          onPress={onStudyPress}
        />
      </View>
    </View>
  );
}

export { CollectionDetailHero };

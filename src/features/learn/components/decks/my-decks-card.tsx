import { Pressable } from 'react-native';
import { Button, Text, View } from '@/components/ui';
import { PlayIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';

type Props = {
  emoji?: string;
  lesson?: number;
  level?: string;
  onPress?: () => void;
  progress?: number;
  title?: string;
  total?: number;
};

export default function MyDecksCard({
  emoji = '💼',
  lesson = 1,
  level = 'B1',
  onPress,
  progress = 12,
  title = 'Business English',
  total = 20,
}: Props) {
  const percent = Math.min(100, Math.round((progress / Math.max(1, total)) * 100));

  return (
    <Pressable
      onPress={onPress}
      className="mt-2.5 flex-row items-center justify-between rounded-2xl border border-neutral-200/80 bg-white p-3.5 active:scale-[0.99] dark:border-neutral-800 dark:bg-neutral-900"
    >
      <View className="mr-3 flex-1 flex-row items-center gap-3">
        {/* Emoji / Topic Icon */}
        <View className="size-12 items-center justify-center rounded-xl border border-primary-200 bg-primary-50 dark:border-primary-900 dark:bg-primary-900/40">
          <Text className="text-2xl">{emoji}</Text>
        </View>

        {/* Info Column */}
        <View className="flex-1">
          <Text
            className="mb-0.5 font-nunito text-[15px] font-extrabold text-mascot-navy dark:text-white"
            numberOfLines={1}
          >
            {title}
          </Text>

          {/* Level badge + Lesson progress */}
          <View className="flex-row items-center gap-1.5">
            <View className="rounded-sm border border-primary-200 bg-primary-50 px-1.5 py-0.5 dark:border-primary-800 dark:bg-primary-900/60">
              <Text className="font-nunito text-[10px] font-extrabold text-primary-700 dark:text-primary-300">
                {level}
              </Text>
            </View>

            <Text className="font-inter text-xs font-medium text-neutral-400" numberOfLines={1}>
              {translate('learn.lesson_progress', {
                lesson,
                progress,
                total,
              })}
            </Text>
          </View>

          {/* Progress Bar */}
          <View className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <View
              className="h-full rounded-full bg-primary-500"
              style={{ width: `${percent}%` }}
            />
          </View>
        </View>
      </View>

      {/* Action Button */}
      <Button
        fullWidth={false}
        size="sm"
        tx="learn.learn"
        icon={<PlayIcon width={12} height={12} fill="#FFFFFF" />}
        onPress={onPress}
        className="shrink-0 px-3"
      />
    </Pressable>
  );
}

export { MyDecksCard };

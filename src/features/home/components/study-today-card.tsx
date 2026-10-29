import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Button, Text } from '@/components/ui';
import { FlashcardIcon, PlayIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';

export function StudyTodayCard() {
  const router = useRouter();
  return (
    <View className="mb-3 overflow-hidden rounded-3xl border-2 border-b-[5px] border-emerald-300 border-b-emerald-500 bg-emerald-50 p-4 dark:border-line dark:border-b-edge dark:bg-surface">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="font-nunito text-xl font-black text-mascot-navy dark:text-white">
            {translate('learn.hub.study_today_title')}
          </Text>
          <Text className="mt-1 font-inter text-[13px] leading-[18px] text-neutral-600 dark:text-neutral-300">
            {translate('learn.hub.study_today_desc')}
          </Text>
        </View>
        <View className="size-12 items-center justify-center rounded-2xl border-2 border-b-4 border-emerald-200 border-b-emerald-300 bg-white dark:border-line dark:border-b-edge dark:bg-surface-raised">
          <FlashcardIcon width={24} height={24} color="#16A34A" />
        </View>
      </View>
      <View className="mt-3">
        <Button
          label={translate('learn.hub.start_study')}
          variant="primary"
          icon={<PlayIcon width={16} height={16} fill="#FFFFFF" />}
          onPress={() => router.push('/(app)/study/select' as any)}
        />
      </View>
    </View>
  );
}

export default StudyTodayCard;

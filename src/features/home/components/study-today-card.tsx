import { Alert, View } from 'react-native';
import { Button, Text } from '@/components/ui';
import { FlashcardIcon, PlayIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';

export function StudyTodayCard() {
  return (
    <View className="mb-4 overflow-hidden rounded-3xl border-2 border-b-[5px] border-emerald-300 border-b-emerald-500 bg-emerald-50 p-5 dark:border-emerald-800 dark:border-b-emerald-950 dark:bg-emerald-950/40">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-4">
          <Text className="font-nunito text-2xl font-black text-mascot-navy dark:text-white">
            {translate('learn.hub.study_today_title')}
          </Text>
          <Text className="mt-1 font-inter text-sm/5 text-neutral-600 dark:text-neutral-300">
            {translate('learn.hub.study_today_desc')}
          </Text>
        </View>
        <View className="size-14 items-center justify-center rounded-2xl border-2 border-b-4 border-emerald-200 border-b-emerald-300 bg-white dark:border-emerald-800 dark:border-b-emerald-900 dark:bg-neutral-900">
          <FlashcardIcon width={27} height={27} color="#16A34A" />
        </View>
      </View>
      <View className="mt-4">
        <Button
          label={translate('learn.hub.start_study')}
          variant="primary"
          icon={<PlayIcon width={16} height={16} fill="#FFFFFF" />}
          onPress={() => Alert.alert(
            translate('learn.hub.study_coming_title'),
            translate('learn.hub.study_coming_desc'),
          )}
        />
      </View>
    </View>
  );
}

export default StudyTodayCard;

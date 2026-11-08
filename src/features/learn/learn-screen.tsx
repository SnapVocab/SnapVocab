import { useRouter } from 'expo-router';
import { ArrowRightIcon } from 'lucide-react-native';
import { Image, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FocusAwareStatusBar, Text, useColorMode, useSurface, View } from '@/components/ui';
import { translate } from '@/lib/i18n';

export function LearnScreen() {
  const surface = useSurface();
  const colorMode = useColorMode();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const options = [
    { id: 'collections', title: translate('home.collections'), description: translate('learn.collections.subtitle'), action: translate('learn.open_collections'), art: require('../../assets/images/snapy-reading.png'), route: '/collections', tone: 'bg-primary-50 dark:bg-primary-400/10', button: 'bg-brand', buttonText: 'text-[#17330B] dark:text-[#17330B]' },
    { id: 'quiz', title: translate('home.quiz'), description: translate('learn.quiz_subtitle'), action: translate('learn.play_quiz'), art: require('../../assets/images/mascot/actions/snapy-nhay-len.png'), route: '/study/quiz-setup', tone: 'bg-violet-50 dark:bg-violet-400/10', button: 'bg-purple-500 dark:bg-[#A48BE6]', buttonText: 'text-white dark:text-[#1C1430]' },
  ] as const;

  return (
    <View style={{ flex: 1, backgroundColor: surface.background }}>
      <FocusAwareStatusBar />
      <View style={{ paddingTop: insets.top + 16, backgroundColor: surface.headerBg }} className="px-5 pb-3">
        <Text className="font-nunito text-2xl font-black text-mascot-navy dark:text-white">
          {translate('learn.tab_label')}
        </Text>
        <Text className="mt-0.5 font-inter text-[13px] font-medium text-neutral-500 dark:text-neutral-400">
          {translate('learn.choose_activity')}
        </Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerClassName="gap-4 px-4 pt-5 pb-8">
        {options.map(({ id, title, description, action, art, route, tone, button, buttonText }) => (
          <Pressable
            key={id}
            accessibilityRole="button"
            accessibilityLabel={title}
            accessibilityHint={description}
            onPress={() => router.push(route)}
            className={`min-h-44 flex-row items-center gap-2 overflow-hidden rounded-2xl border-2 border-b-4 border-line border-b-edge p-5 active:translate-y-[2px] active:border-b-2 ${tone}`}
          >
            <View className="flex-1 items-start gap-2">
              <Text className="font-nunito text-[22px] font-black text-mascot-navy dark:text-white">{title}</Text>
              <Text className="font-inter text-sm/5 text-neutral-600 dark:text-neutral-300">{description}</Text>
              <View className={`mt-2 min-h-12 flex-row items-center gap-2 rounded-xl border-b-4 px-4 py-2 ${id === 'quiz' ? 'border-purple-700 dark:border-b-[#5D4A8E]' : 'border-brand-edge'} ${button}`}>
                <Text className={`shrink font-nunito text-[13px] font-black ${buttonText}`}>{action}</Text>
                <ArrowRightIcon size={16} color={id === 'quiz' ? (colorMode === 'dark' ? '#1C1430' : '#FFFFFF') : '#17330B'} />
              </View>
            </View>
            <Image accessible={false} source={art} className="size-28" resizeMode="contain" />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export default LearnScreen;

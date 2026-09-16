import { useRouter } from 'expo-router';
import { Pressable, ScrollView } from 'react-native';
import { FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { MyDecksCard } from './components';

const SAMPLE_DECKS = [
  {
    emoji: '💼',
    id: '1',
    lesson: 1,
    level: 'B1',
    progress: 12,
    title: 'Business English',
    total: 20,
  },
  {
    emoji: '✈️',
    id: '2',
    lesson: 3,
    level: 'A2',
    progress: 8,
    title: 'Travel & Tourism',
    total: 15,
  },
];

export function LearnScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="p-4 pb-8"
      >
        {/* Section Header: My Decks */}
        <View className="flex-row items-center justify-between">
          <Text className="font-nunito text-xs font-extrabold tracking-wider text-neutral-400 uppercase">
            {translate('learn.collections.title')}
          </Text>
          <Pressable onPress={() => router.push('/collections')} hitSlop={8}>
            <Text className="font-inter text-xs font-bold text-neutral-500">
              {`${translate('learn.view_all')} →`}
            </Text>
          </Pressable>
        </View>

        {/* Deck Cards List */}
        <View className="mt-1">
          {SAMPLE_DECKS.map(deck => (
            <MyDecksCard
              key={deck.id}
              emoji={deck.emoji}
              lesson={deck.lesson}
              level={deck.level}
              progress={deck.progress}
              title={deck.title}
              total={deck.total}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

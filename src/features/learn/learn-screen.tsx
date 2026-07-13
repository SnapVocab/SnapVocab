import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';
import { FocusAwareStatusBar, ListItem, SafeAreaView, Text, View } from '@/components/ui';
import {
  BookIcon,
  FlashCardsIcon,
  SRSReviewIcon,
  StatisticIcon,
  TrophyIcon,
} from '@/components/ui/icons';
import { LearningGoalCard } from './components/learning-goal-card';

export function LearnScreen() {
  const router = useRouter();
  return (
    <View className="flex-1 bg-white dark:bg-neutral-900">
      <SafeAreaView className="flex-1">
        <FocusAwareStatusBar />

        <View className="gap-2 border-b border-gray-200 bg-white px-5 py-3 dark:border-neutral-700 dark:bg-neutral-900">
          <Text className="text-2xl font-extrabold">Learn</Text>
          <Text className="text-sm font-bold text-muted-foreground">
            Pick how you want to study today
          </Text>
        </View>

        <ScrollView className="bg-gray-100" contentContainerStyle={{ paddingBottom: 100 }}>
          <View className="min-h-175 px-5 pt-5">
            <LearningGoalCard />
            <Text className="text-xl font-extrabold">Study tools</Text>
            <View className="gap-1">
              <ListItem
                icon={BookIcon}
                label="My vocabulary"
                iconColor="#4F46E5"
                bgColor="#E7EDFF"
                onPress={() => router.push('/')}
              />
              <ListItem
                icon={FlashCardsIcon}
                label="Flashcards"
                iconColor="#F7357F"
                bgColor="#FFE4EB"
              />
              <ListItem icon={TrophyIcon} label="Quiz" iconColor="#F4A429" bgColor="#FFEECD" />
              <ListItem
                icon={SRSReviewIcon}
                label="SRS Review"
                iconColor="#29C45C"
                bgColor="#D8F8DD"
              />
              <ListItem
                icon={StatisticIcon}
                label="Statistics"
                iconColor="#00A6E5"
                bgColor="#D5F4FF"
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

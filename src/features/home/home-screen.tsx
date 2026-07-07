import { Link } from 'expo-router';

import * as React from 'react';
import { ScrollView } from 'react-native';
import {
  Avatar,
  FocusAwareStatusBar,
  MissionCard,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';

import {
  AccuracyIcon,
  FlameIcon,
  FlashcardIcon,
  MissionFlashcardIcon,
} from '@/components/ui/icons';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { translate } from '@/lib/i18n';
import { CurrentUnitCard } from './components/current-unit-card';
import { LevelCard } from './components/level-card';
import { MetricCard } from './components/metric-card';
import { NotificationButton } from './components/notification-button';
import { StreakPill } from './components/streak-pill';
import { getGreetingKey } from './utils';

export function HomeScreen() {
  const user = useAuthStore.use.user();
  const displayName = user?.firstName?.split('@')[0] ?? 'U';
  const userName = user?.firstName ?? 'User';

  return (
    <SafeAreaView className="flex-1 bg-neutral-200 dark:bg-neutral-900">
      <FocusAwareStatusBar />

      <View className="flex-row items-center justify-between px-5 py-3">
        <View className="flex-row items-center">
          <Avatar name={displayName} size={36} avatarUrl={user?.avatarUrl} />
          <View className="ml-2 flex-col">
            <Text
              tx={getGreetingKey()}
              className="text-[10px] font-bold text-[#3525CD] uppercase"
            />
            <Text className="text-[20px] font-bold">
              {translate('home.greeting_name', { name: userName })}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center">
          <View className="mr-2">
            <StreakPill streak={user?.streakDays ?? 0} />
          </View>
          <NotificationButton unread={true} size={24} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="gap-5 px-5 pt-5">
          <LevelCard
            level={12}
            maxXP={5140}
            currentXP={4820}
            barColor="white"
            trackColor="#7DD3FC"
          />

          <View className="flex-row justify-between">
            <MetricCard
              icon={() => <FlameIcon width={32} height={32} />}
              value="23"
              label="STREAK"
            />
            <MetricCard icon={() => <FlashcardIcon />} value="482" label="WORDS" />
            <MetricCard icon={() => <AccuracyIcon />} value="92%" label="ACCURACY" />
          </View>

          <View className="flex-row justify-between">
            <Text
              className="text-[22px] font-bold text-neutral-900 dark:text-white"
              tx="home.daily_mission"
            />
            <Link href="/">
              <Text className="text-[13px] font-bold text-[#3525CD]" tx="home.see_all" />
            </Link>
          </View>

          <MissionCard
            icon={() => <MissionFlashcardIcon />}
            label="Review 10 flashcards"
            currentProgress={7}
            totalProgress={10}
            trackColor="#E2E8F0"
            barColor="#FB923C"
            xpReward={20}
          />

          <Text
            className="text-[22px] font-bold text-neutral-900 dark:text-white"
            tx="home.continue_learning"
          />
          <CurrentUnitCard currentLesson={4} lessonCount={5} unitName="KITCHEN" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

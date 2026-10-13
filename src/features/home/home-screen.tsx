import type { Href } from 'expo-router';
import type { HomeWidgetDTO } from '@/features/progress/types';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { Snapy } from '@/components/Snapy';
import { Button, FocusAwareStatusBar, SafeAreaView, Text } from '@/components/ui';
import { ChevronRightIcon } from '@/components/ui/icons';
import { useAuthStore } from '@/features/auth/use-auth-store';
import {
  deriveVocabularySegments,
  invalidateProgress,
  LevelOverviewCard,
  MultiSegmentBar,
  SectionError,
  SRS_ENABLED,
  useHomeWidget,
  useStreak,
  useXpOverview,
} from '@/features/progress';
import {
  HomeSearchBar,
  QuickStudyGrid,
} from './components';

export function HomeScreen() {
  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }} className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <HomeSearchBar />
      </ScrollView>
    </SafeAreaView>
  );
}

export default HomeScreen;

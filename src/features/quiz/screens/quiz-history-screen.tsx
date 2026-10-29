/* eslint-disable max-lines-per-function */
import type { QuizHistorySummaryResponse, QuizMode } from '../types';
import type { HistoryFilterMode } from '../utils';
import type { TxKeyPath } from '@/lib/i18n';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { twMerge } from 'tailwind-merge';
import { BackButton } from '@/components/ui';
import {
  ArrowRightIcon,
  EditIcon,
  LayersIcon,
  LayoutGridIcon,
} from '@/components/ui/icons';
import { Snapy } from '@/components/ui/snapy';
import { translate } from '@/lib/i18n';
import { useInfiniteQuizHistory } from '../api/quiz-api';
import {
  filterQuizHistoryItems,
  formatQuizAccuracy,
  formatQuizSubmittedDate,
  quizHistoryAction,
} from '../utils';

const FILTER_TABS: { key: HistoryFilterMode; label: TxKeyPath }[] = [
  { key: 'ALL', label: 'quiz.filter_all' },
  { key: 'MCQ', label: 'quiz.multiple_choice' },
  { key: 'MATCHING', label: 'quiz.matching' },
  { key: 'FILL_BLANK', label: 'quiz.fill_blank' },
];

export function QuizHistoryScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<HistoryFilterMode>('ALL');

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuizHistory(20);

  const allItems = useMemo<QuizHistorySummaryResponse[]>(() => {
    if (!data?.pages)
      return [];
    return data.pages.flatMap(page => page.data || []);
  }, [data]);

  const filteredItems = useMemo(() => {
    return filterQuizHistoryItems(allItems, selectedFilter);
  }, [allItems, selectedFilter]);

  // The filter runs on loaded pages only: an empty list has nothing to scroll, so onEndReached never
  // fires. Keep loading until a match shows up or the server has no more pages.
  // ponytail: may page through the whole history for a rare mode; add a `mode` param to
  // GET /api/me/quizzes if histories get long.
  const searchingMore = filteredItems.length === 0 && !!hasNextPage;
  useEffect(() => {
    if (searchingMore && !isFetchingNextPage)
      void fetchNextPage();
  }, [searchingMore, isFetchingNextPage, fetchNextPage]);

  const handleCardPress = (item: QuizHistorySummaryResponse) => {
    const action = quizHistoryAction(item.status);
    if (action === 'NONE')
      return;
    router.push({
      pathname: (action === 'RESUME'
        ? '/(app)/study/quiz-session'
        : '/(app)/study/quiz-result') as any,
      params: { quizId: String(item.quizId) },
    });
  };

  const getModeBadge = (type: QuizMode) => {
    switch (type) {
      case 'MCQ':
        return {
          label: translate('quiz.multiple_choice'),
          Icon: LayoutGridIcon,
          bgClass: 'bg-blue-50 dark:bg-blue-950/40',
          textClass: 'text-blue-700 dark:text-blue-300',
          borderClass: 'border-blue-200 dark:border-blue-800',
        };
      case 'MATCHING':
        return {
          label: translate('quiz.matching'),
          Icon: LayersIcon,
          bgClass: 'bg-purple-50 dark:bg-purple-950/40',
          textClass: 'text-purple-700 dark:text-purple-300',
          borderClass: 'border-purple-200 dark:border-purple-800',
        };
      case 'FILL_BLANK':
        return {
          label: translate('quiz.fill_blank'),
          Icon: EditIcon,
          bgClass: 'bg-amber-50 dark:bg-amber-950/40',
          textClass: 'text-amber-700 dark:text-amber-300',
          borderClass: 'border-amber-200 dark:border-amber-800',
        };
      default:
        return {
          label: type,
          Icon: LayoutGridIcon,
          bgClass: 'bg-neutral-100 dark:bg-neutral-800',
          textClass: 'text-neutral-700 dark:text-neutral-300',
          borderClass: 'border-line',
        };
    }
  };

  const renderHistoryCard = ({ item }: { item: QuizHistorySummaryResponse }) => {
    const modeInfo = getModeBadge(item.mode);
    const action = quizHistoryAction(item.status);
    const accuracy = formatQuizAccuracy(item.accuracy);
    const dateFormatted = formatQuizSubmittedDate(item.completedAt || item.createdAt);
    const ModeIcon = modeInfo.Icon;

    const isHighAccuracy = accuracy >= 80;
    const isMediumAccuracy = accuracy >= 50 && accuracy < 80;

    return (
      <Pressable
        onPress={() => handleCardPress(item)}
        className="mb-3.5 rounded-[20px] border border-line bg-surface p-4 shadow-sm active:bg-pressed"
      >
        {/* 1. Top Badges: Max 1-2 badges (Mode, Review, Status if IN_PROGRESS) */}
        <View className="mb-3 flex-row items-center gap-2">
          <View
            className={twMerge(
              'flex-row items-center gap-1.5 rounded-lg border px-2.5 py-1',
              modeInfo.bgClass,
              modeInfo.borderClass,
            )}
          >
            <ModeIcon width={13} height={13} stroke="#2563EB" />
            <Text className={twMerge('font-nunito text-[11px] font-extrabold', modeInfo.textClass)}>
              {modeInfo.label}
            </Text>
          </View>

          {item.status === 'IN_PROGRESS' && (
            <View className="rounded-lg bg-amber-100 px-2.5 py-1 dark:bg-amber-950/40">
              <Text className="font-nunito text-[11px] font-bold text-amber-800 dark:text-amber-300">
                {translate('quiz.status_in_progress')}
              </Text>
            </View>
          )}

          {item.status === 'CANCELLED' && (
            <View className="rounded-lg bg-neutral-100 px-2.5 py-1 dark:bg-neutral-700">
              <Text className="font-nunito text-[11px] font-bold text-neutral-600 dark:text-neutral-300">
                {translate('quiz.status_cancelled')}
              </Text>
            </View>
          )}

          {item.status === 'EXPIRED' && (
            <View className="rounded-lg bg-neutral-100 px-2.5 py-1 dark:bg-neutral-700">
              <Text className="font-nunito text-[11px] font-bold text-neutral-600 dark:text-neutral-300">
                {translate('quiz.status_expired')}
              </Text>
            </View>
          )}
        </View>

        {/* 2. Middle: Topic Name & Timestamp */}
        <View className="mb-1">
          <Text
            numberOfLines={1}
            className="font-nunito text-[17px] font-extrabold text-mascot-navy dark:text-white"
          >
            {item.topicName || translate('quiz.default_topic')}
          </Text>
          <Text className="mt-1 font-inter text-[12px] font-medium text-neutral-400 dark:text-neutral-400">
            {dateFormatted}
          </Text>
        </View>

        {/* 3. Divider */}
        <View className="my-3.5 h-px bg-neutral-100 dark:bg-neutral-700/60" />

        {/* 4. Stats Row */}
        <View className="flex-row items-center justify-between">
          {/* Only a COMPLETED quiz has final metrics; null is "no score yet", never 0%. */}
          {item.status !== 'COMPLETED' ? (
            <Text className="font-inter text-[13px] font-bold text-neutral-500 dark:text-neutral-400">
              {item.questionCount}
              {item.mode === 'MATCHING' ? ` ${translate('quiz.pairs')}` : ` ${translate('quiz.questions')}`}
              {` · ${translate('quiz.no_score_yet')}`}
            </Text>
          ) : (
            <View className="flex-row items-center gap-3">
              {/* Accuracy tinted surface */}
              <View
                className={twMerge(
                  'min-w-[76px] items-center justify-center rounded-xl px-2.5 py-1.5',
                  isHighAccuracy
                    ? 'bg-emerald-50 dark:bg-emerald-950/40'
                    : isMediumAccuracy
                      ? 'bg-sky-50 dark:bg-sky-950/40'
                      : 'bg-rose-50 dark:bg-rose-950/40',
                )}
              >
                <Text
                  className={twMerge(
                    'font-nunito text-[16px] font-black tracking-tight',
                    isHighAccuracy
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : isMediumAccuracy
                        ? 'text-sky-700 dark:text-sky-300'
                        : 'text-rose-700 dark:text-rose-300',
                  )}
                >
                  {accuracy}
                  %
                </Text>
                <Text
                  className={twMerge(
                    'font-inter text-[9.5px] font-semibold tracking-wider uppercase',
                    isHighAccuracy
                      ? 'text-emerald-600/80 dark:text-emerald-400/80'
                      : isMediumAccuracy
                        ? 'text-sky-600/80 dark:text-sky-400/80'
                        : 'text-rose-600/80 dark:text-rose-400/80',
                  )}
                >
                  {translate('quiz.accuracy')}
                </Text>
              </View>

              {/* Counts */}
              <View className="gap-0.5">
                <Text className="font-inter text-[13px] font-bold text-neutral-700 dark:text-neutral-200">
                  {item.correctCount ?? 0}
                  /
                  {item.questionCount}
                  {' '}
                  {translate('quiz.correct')}
                  {(item.incorrectCount ?? 0) > 0 && (
                    <Text className="font-semibold text-rose-600 dark:text-rose-400">
                      {' · '}
                      {item.incorrectCount}
                      {' '}
                      {translate('quiz.incorrect')}
                    </Text>
                  )}
                </Text>
              </View>
            </View>
          )}

          {/* Action indicator with clear touch target — an expired session offers no action */}
          {action === 'NONE' ? (
            <View className="min-h-10 flex-row items-center px-1">
              <Text className="font-inter text-[12px] font-bold text-neutral-400 dark:text-neutral-400">
                {translate('quiz.cannot_continue')}
              </Text>
            </View>
          ) : (
            <View className="min-h-10 flex-row items-center gap-1 px-1">
              <Text className="font-nunito text-[13px] font-extrabold text-[#394158] dark:text-neutral-300">
                {action === 'RESUME' ? translate('quiz.resume') : translate('quiz.review')}
              </Text>
              <ArrowRightIcon width={14} height={14} stroke="#394158" />
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {/* 1. HEADER */}
      <View className="flex-row items-center justify-between border-b border-line bg-surface px-4 py-3">
        <BackButton onPress={() => router.back()} className="-ml-2" />
        <Text className="font-nunito text-[18px] font-extrabold text-mascot-navy dark:text-white">
          {translate('quiz.history_title')}
        </Text>
        <View className="w-8" />
      </View>

      {/* 2. FILTER TABS - HORIZONTAL SCROLL CHIPS */}
      <View className="border-b border-line bg-surface py-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {FILTER_TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setSelectedFilter(tab.key)}
              className={twMerge(
                'h-10 items-center justify-center rounded-full border px-4',
                selectedFilter === tab.key
                  ? 'border-primary-500 bg-primary-50 dark:border-[#7FA35E] dark:bg-primary-500/15'
                  : 'border-edge bg-surface',
              )}
            >
              <Text
                className={twMerge(
                  'font-nunito text-[13px] font-bold',
                  selectedFilter === tab.key
                    ? 'text-primary-700 dark:text-primary-300'
                    : 'text-neutral-600 dark:text-neutral-300',
                )}
              >
                {translate(tab.label)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 3. LIST OF CARDS */}
      {isLoading
        ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#0EA5E9" />
              <Text className="mt-3 font-inter text-[14px] text-neutral-400">
                {translate('quiz.history_loading')}
              </Text>
            </View>
          )
        : isError
          ? (
              <View className="flex-1 items-center justify-center p-6">
                <Text className="text-center font-nunito text-[16px] font-bold text-neutral-600 dark:text-neutral-300">
                  {translate('quiz.history_error')}
                </Text>
                <TouchableOpacity
                  onPress={() => refetch()}
                  className="mt-4 rounded-xl bg-brand px-5 py-2.5"
                >
                  <Text className="font-nunito text-[14px] font-bold text-on-brand">{translate('quiz.retry')}</Text>
                </TouchableOpacity>
              </View>
            )
          : (
              <FlatList
                data={filteredItems}
                keyExtractor={item => String(item.quizId)}
                renderItem={renderHistoryCard}
                contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
                showsVerticalScrollIndicator={false}
                refreshControl={(
                  <RefreshControl
                    refreshing={isRefetching}
                    onRefresh={refetch}
                    tintColor="#0EA5E9"
                  />
                )}
                onEndReached={() => {
                  if (hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                  }
                }}
                onEndReachedThreshold={0.4}
                ListFooterComponent={
                  isFetchingNextPage
                    ? (
                        <View className="items-center py-4">
                          <ActivityIndicator size="small" color="#0EA5E9" />
                        </View>
                      )
                    : null
                }
                ListEmptyComponent={searchingMore
                  ? (
                      <View className="items-center py-16">
                        <ActivityIndicator size="small" color="#0EA5E9" />
                      </View>
                    )
                  : (
                      <View className="items-center justify-center py-16">
                        <Snapy pose="suy_nghi" animation="idle" style={{ width: 110, height: 110 }} />
                        <Text className="mt-4 font-nunito text-[18px] font-extrabold text-mascot-navy dark:text-white">
                          {selectedFilter === 'ALL'
                            ? translate('quiz.history_empty_title')
                            : translate('quiz.history_empty_filtered', { mode: translate(FILTER_TABS.find(t => t.key === selectedFilter)?.label ?? 'quiz.title') })}
                        </Text>
                        <Text className="mt-1 px-6 text-center font-inter text-[14px] text-neutral-400">
                          {translate('quiz.history_empty_body')}
                        </Text>
                        <TouchableOpacity
                          onPress={() => router.push('/(app)/study/quiz-setup' as any)}
                          className="mt-6 rounded-2xl bg-brand px-6 py-3.5"
                        >
                          <Text className="font-nunito text-[15px] font-extrabold text-on-brand uppercase">
                            {translate('quiz.start_quiz_now')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
              />
            )}
    </SafeAreaView>
  );
}

export default QuizHistoryScreen;

import type { FsrsRating, ReviewResult } from './api';
import type { CardSide } from '@/features/card-renderer/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { BackButton, Pressable, SafeAreaView, Text } from '@/components/ui';
import { RotateCwIcon, TrophyIcon } from '@/components/ui/icons';
import { Snapy } from '@/components/ui/snapy';
import { DynamicCardRenderer } from '@/features/card-renderer/dynamic-card-renderer';
import { useCollection } from '@/features/learn/api';
import { useSchema, useTopicSchema } from '@/features/template-builder/api';
import { translate } from '@/lib/i18n';
import { useStudyQueue, useSubmitStudyRating } from './api';

const RATINGS: {
  value: FsrsRating;
  title: string;
  color: string;
  background: string;
}[] = [
  {
    value: 'AGAIN',
    title: 'Again',
    color: '#E11D48',
    background: 'bg-rose-50 dark:bg-rose-950/40',
  },
  {
    value: 'HARD',
    title: 'Hard',
    color: '#D97706',
    background: 'bg-amber-50 dark:bg-amber-950/40',
  },
  {
    value: 'GOOD',
    title: 'Good',
    color: '#059669',
    background: 'bg-emerald-50 dark:bg-emerald-950/40',
  },
  {
    value: 'EASY',
    title: 'Easy',
    color: '#0284C7',
    background: 'bg-sky-50 dark:bg-sky-950/40',
  },
];
export function StudySessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    collectionId?: string;
    collectionName?: string;
    topicId?: string;
    topicName?: string;
  }>();
  const collectionId = Number(params.collectionId);
  const topicId = params.topicId ? Number(params.topicId) : undefined;
  const scope = React.useMemo(
    () => ({ collectionId, topicId }),
    [collectionId, topicId],
  );
  const { data: collection } = useCollection(collectionId);
  const queueQuery = useStudyQueue(scope);
  const submitRating = useSubmitStudyRating();
  const [removedCardIds, setRemovedCardIds] = React.useState<Set<number>>(
    () => new Set(),
  );
  const [latestReview, setLatestReview] = React.useState<ReviewResult | null>(
    null,
  );
  const [side, setSide] = React.useState<CardSide>('FRONT');
  const [reviewedThisSession, setReviewedThisSession] = React.useState(0);
  const studiedToday =
    latestReview?.studiedToday ?? queueQuery.data?.studiedToday ?? 0;
  const dailyGoal = latestReview?.dailyGoal ?? queueQuery.data?.dailyGoal ?? 0;
  const remainingToday =
    latestReview?.remainingToday ?? queueQuery.data?.remainingToday ?? 0;
  const cards =
    dailyGoal > 0 && remainingToday <= 0
      ? []
      : (queueQuery.data?.cards ?? []).filter(
          card => !removedCardIds.has(card.item.topicItemId),
        );
  const currentCard = cards[0];
  const goalComplete = dailyGoal > 0 && remainingToday <= 0;
  const { data: topicSchema, isLoading: isTopicSchemaLoading } = useTopicSchema(
    currentCard?.topicId,
  );
  const { data: fullSchema, isLoading: isFullSchemaLoading } = useSchema(
    topicSchema?.schemaId,
  );
  const template = React.useMemo(
    () =>
      fullSchema?.templates?.find(item => item.isDefault) ??
      fullSchema?.templates?.[0],
    [fullSchema],
  );
  const handleRate = async (rating: FsrsRating) => {
    if (!currentCard || submitRating.isPending)
      return;
    try {
      const result = await submitRating.mutateAsync({
        ...scope,
        topicItemId: currentCard.item.topicItemId,
        rating,
      });
      setLatestReview(result);
      setReviewedThisSession(value => value + 1);
      setRemovedCardIds(previous =>
        new Set(previous).add(currentCard.item.topicItemId),
      );
      setSide('FRONT');
    }
    catch (error: any) {
      const code = error?.response?.data?.error;
      if (code === 'DAILY_QUOTA_REACHED') {
        Alert.alert(
          'Daily goal reached',
          'You have used today\'s collection quota.',
        );
      }
      else {
        Alert.alert(
          'Could not save review',
          error?.response?.data?.error ||
          error?.message ||
          'Please try again.',
        );
      }
    }
  };
  const refreshQueue = async () => {
    const result = await queueQuery.refetch();
    if (result.data) {
      setRemovedCardIds(new Set());
      setLatestReview(null);
      setReviewedThisSession(0);
      setSide('FRONT');
    }
  };
  const title =
    params.topicName ||
    params.collectionName ||
    collection?.name ||
    translate('learn.hub.study_today_title');
  const schemaLoading = Boolean(
    currentCard && (isTopicSchemaLoading || isFullSchemaLoading),
  );
  if (queueQuery.isLoading) {
    return (
      <SafeAreaView
        edges={['top', 'bottom', 'left', 'right']}
        style={{ flex: 1 }}
        className="flex-1 bg-[#F7F8F2] dark:bg-neutral-950"
      >
        <View className="flex-1 items-center justify-center px-8">
          <Snapy pose="tap_trung" animation="idle" style={{ width: 120, height: 120 }} />
          <ActivityIndicator size="large" color="#16A34A" className="mt-4" />
          <Text className="mt-4 font-nunito text-lg font-black text-mascot-navy dark:text-white">
            {translate('learn.hub.study_loading_queue')}
          </Text>
          <Text className="mt-1 text-center font-inter text-sm text-neutral-500 dark:text-neutral-400">
            {translate('learn.hub.study_loading_ready')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  if (queueQuery.isError) {
    return (
      <SafeAreaView
        edges={['top', 'bottom', 'left', 'right']}
        style={{ flex: 1 }}
        className="flex-1 items-center justify-center bg-[#F7F8F2] p-6 dark:bg-neutral-950"
      >
        <Snapy pose="bat_ngo" animation="none" style={{ width: 112, height: 112 }} />
        <Text className="mt-4 text-center font-nunito text-lg font-black text-mascot-navy dark:text-white">
          {translate('learn.hub.study_queue_error')}
        </Text>
        <Pressable
          onPress={() => queueQuery.refetch()}
          accessibilityRole="button"
          className="mt-5 min-h-12 justify-center rounded-2xl border-2 border-b-4 border-emerald-400 border-b-emerald-700 bg-emerald-500 px-6 active:translate-y-px active:border-b-2"
        >
          <Text className="text-center font-nunito font-extrabold text-white">
            {translate('learn.hub.study_retry')}
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={{ flex: 1 }}
      className="flex-1 bg-[#F7F8F2] dark:bg-neutral-950"
    >
      <View className="bg-white px-4 pt-2 pb-4 dark:bg-neutral-900">
        <View className="flex-row items-center gap-3">
          <BackButton onPress={() => router.back()} className="mr-0.5" />
          <View className="flex-1">
            <Text
              className="font-nunito text-lg font-black text-mascot-navy dark:text-white"
              numberOfLines={1}
            >
              {title}
            </Text>
            <Text className="mt-0.5 font-inter text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              {translate('learn.hub.study_progress', {
                studied: studiedToday,
                goal: dailyGoal,
                remaining: remainingToday,
              })}
            </Text>
          </View>
          <View className="rounded-xl bg-emerald-50 px-3 py-2 dark:bg-emerald-950/50">
            <Text className="font-nunito text-xs font-black text-emerald-700 dark:text-emerald-300">
              {translate('learn.hub.study_due_count', { count: cards.length })}
            </Text>
          </View>
        </View>
        <View className="mt-3 h-3 overflow-hidden rounded-full border border-emerald-100 bg-emerald-50 dark:border-emerald-900 dark:bg-neutral-800">
          <View
            className="h-full rounded-full bg-emerald-500"
            style={{
              width: `${dailyGoal > 0 ? Math.min(100, (studiedToday / dailyGoal) * 100) : 0}%`,
            }}
          />
        </View>
      </View>
      {currentCard ? (
        <>
          <View className="flex-1 justify-center px-4 py-3">
            {schemaLoading ? (
              <View className="items-center py-12">
                <ActivityIndicator color="#16A34A" />
              </View>
            ) : (
              <DynamicCardRenderer
                key={currentCard.item.topicItemId}
                template={template}
                schema={topicSchema || fullSchema}
                data={currentCard.item}
                side={side}
                onFlip={setSide}
                isInteractive
                minHeight={400}
              />
            )}
            {side === 'FRONT' && !schemaLoading && (
              <Pressable
                onPress={() => setSide('BACK')}
                className="mt-3 flex-row items-center justify-center gap-2 rounded-2xl border-2 border-b-4 border-emerald-200 border-b-emerald-400 bg-emerald-50 py-3.5 active:translate-y-px active:border-b-2 dark:border-emerald-900 dark:border-b-emerald-950 dark:bg-emerald-950/50"
              >
                <RotateCwIcon width={17} height={17} color="#64748B" />
                <Text className="font-nunito font-black text-emerald-800 dark:text-emerald-200">
                  {translate('learn.hub.study_show_answer')}
                </Text>
              </Pressable>
            )}
          </View>
          <View className="bg-white px-4 pt-3 pb-5 dark:bg-neutral-900">
            {side === 'BACK' ? (
              <View className="flex-row gap-1.5">
                {RATINGS.map(rating => (
                  <Pressable
                    key={rating.value}
                    onPress={() => handleRate(rating.value)}
                    disabled={submitRating.isPending}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: submitRating.isPending }}
                    className={`h-12 flex-1 items-center justify-center rounded-xl border-2 border-b-4 border-neutral-200 border-b-neutral-300 active:translate-y-px active:border-b-2 dark:border-neutral-700 dark:border-b-neutral-800 ${rating.background}`}
                  >
                    <Text
                      style={{ color: rating.color }}
                      className="font-nunito text-xs font-black"
                    >
                      {submitRating.isPending ? translate('learn.hub.study_saving') : rating.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text className="text-center font-inter text-xs font-semibold text-neutral-400">
                {translate('learn.hub.study_rate_prompt')}
              </Text>
            )}
          </View>
        </>
      ) : (
        <View className="flex-1 items-center justify-center px-7">
          {goalComplete ? (
            <View className="size-24 items-center justify-center rounded-[30px] border-2 border-b-[6px] border-amber-200 border-b-amber-400 bg-amber-50 dark:border-amber-900 dark:border-b-amber-950 dark:bg-amber-950/50">
              <TrophyIcon width={42} height={42} color="#D97706" />
            </View>
          ) : (
            <Snapy pose="proud" animation="none" style={{ width: 112, height: 112 }} />
          )}
          <Text className="mt-5 text-center font-nunito text-2xl font-black text-mascot-navy dark:text-white">
            {goalComplete
              ? translate('learn.hub.study_goal_complete')
              : reviewedThisSession > 0
                ? translate('learn.hub.study_session_complete')
                : translate('learn.hub.study_caught_up')}
          </Text>
          <Text className="mt-2 max-w-sm text-center font-inter text-sm/5 text-neutral-500 dark:text-neutral-400">
            {goalComplete
              ? translate('learn.hub.study_goal_complete_desc')
              : reviewedThisSession > 0
                ? translate('learn.hub.study_session_complete_desc')
                : translate('learn.hub.study_caught_up_desc')}
          </Text>
          <Pressable
            onPress={refreshQueue}
            disabled={queueQuery.isFetching}
            className="mt-6 rounded-2xl border-2 border-b-[5px] border-emerald-400 border-b-emerald-700 bg-emerald-500 px-6 py-3 active:translate-y-px active:border-b-2"
          >
            <Text className="font-nunito font-black text-white">
              {queueQuery.isFetching ? translate('learn.hub.study_checking') : translate('learn.hub.study_check_again')}
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

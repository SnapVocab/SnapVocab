import type { FsrsRating, ReviewResult } from './api';
import type { CardSide } from '@/features/card-renderer/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { Pressable, SafeAreaView, Text } from '@/components/ui';
import { ChevronLeftIcon, RotateCwIcon } from '@/components/ui/icons';
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
  const cards = (queueQuery.data?.cards ?? []).filter(
    card => !removedCardIds.has(card.item.topicItemId),
  );
  const studiedToday =
    latestReview?.studiedToday ?? queueQuery.data?.studiedToday ?? 0;
  const dailyGoal = latestReview?.dailyGoal ?? queueQuery.data?.dailyGoal ?? 0;
  const remainingToday =
    latestReview?.remainingToday ?? queueQuery.data?.remainingToday ?? 0;
  const currentCard = cards[0];
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
  const handleRate = React.useCallback(
    async (rating: FsrsRating) => {
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
    },
    [currentCard, scope, submitRating],
  );
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
          <View className="items-center rounded-[32px] border-2 border-b-[6px] border-emerald-200 border-b-emerald-400 bg-white px-9 py-8 dark:border-emerald-900 dark:border-b-emerald-950 dark:bg-neutral-900">
            <ActivityIndicator size="large" color="#16A34A" />
            <Text className="mt-4 font-nunito text-lg font-black text-mascot-navy dark:text-white">
              Loading study queue...
            </Text>
            <Text className="mt-1 text-center font-inter text-sm text-neutral-500 dark:text-neutral-400">
              Getting your next cards ready
            </Text>
          </View>
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
        <Text className="text-center font-nunito text-lg font-black text-mascot-navy dark:text-white">
          Could not load this study session.
        </Text>
        <Pressable
          onPress={() => queueQuery.refetch()}
          className="mt-5 rounded-xl bg-emerald-600 px-5 py-3"
        >
          <Text className="font-nunito font-extrabold text-white">Retry</Text>
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
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            android_ripple={{ color: 'transparent' }}
            className="size-10 items-center justify-center rounded-2xl border-2 border-b-[3px] border-neutral-200 border-b-neutral-300 bg-white active:translate-y-px active:border-b-2 dark:border-neutral-700 dark:border-b-neutral-800 dark:bg-neutral-800"
          >
            <ChevronLeftIcon width={20} height={20} color="#757793" />
          </Pressable>
          <View className="flex-1">
            <Text className="font-inter text-[10px] font-black tracking-[1.5px] text-emerald-600 uppercase dark:text-emerald-400">
              DAILY QUEST
            </Text>
            <Text
              className="font-nunito text-lg font-black text-mascot-navy dark:text-white"
              numberOfLines={1}
            >
              {title}
            </Text>
            <Text className="mt-0.5 font-inter text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              {studiedToday}
              /
              {dailyGoal}
              {' '}
              today |
              {remainingToday}
              {' '}
              left
            </Text>
          </View>
          <View className="rounded-2xl border-2 border-b-[3px] border-amber-200 border-b-amber-400 bg-amber-50 px-3 py-1.5 dark:border-amber-900 dark:border-b-amber-950 dark:bg-amber-950/50">
            <Text className="font-nunito text-xs font-black text-emerald-700 dark:text-emerald-300">
              {cards.length}
              {' '}
              cards
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
                  Show answer
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
                      {submitRating.isPending ? 'Saving...' : rating.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text className="text-center font-inter text-xs font-semibold text-neutral-400">
                Turn over the card to rate your answer.
              </Text>
            )}
          </View>
        </>
      ) : (
        <View className="flex-1 items-center justify-center px-7">
          <View className="size-24 items-center justify-center rounded-[30px] border-2 border-b-[6px] border-amber-200 border-b-amber-400 bg-amber-50 dark:border-amber-900 dark:border-b-amber-950 dark:bg-amber-950/50">
            <Text className="text-5xl">
              {remainingToday === 0 ? '\u{1F3C6}' : '\u{2728}'}
            </Text>
          </View>
          <Text className="mt-5 text-center font-nunito text-2xl font-black text-mascot-navy dark:text-white">
            {reviewedThisSession > 0
              ? 'Session complete!'
              : 'Nothing due right now'}
          </Text>
          <Text className="mt-2 text-center font-inter text-sm/5 text-neutral-500 dark:text-neutral-400">
            {studiedToday}
            /
            {dailyGoal}
            {' '}
            cards counted today. Repeated reviews of
            the same card do not use more quota.
          </Text>
          <Pressable
            onPress={refreshQueue}
            disabled={queueQuery.isFetching}
            className="mt-6 rounded-2xl border-2 border-b-[5px] border-emerald-400 border-b-emerald-700 bg-emerald-500 px-6 py-3 active:translate-y-px active:border-b-2"
          >
            <Text className="font-nunito font-black text-white">
              {queueQuery.isFetching ? 'Checking...' : 'Check queue again'}
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

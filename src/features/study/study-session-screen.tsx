import type { FsrsRating } from './api';
import type { CardSide } from '@/features/card-renderer/types';
import type { TxKeyPath } from '@/lib/i18n';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { BackButton, Button, Pressable, SafeAreaView, Text } from '@/components/ui';
import { FlameIcon, RotateCwIcon } from '@/components/ui/icons';
import { Snapy } from '@/components/ui/snapy';
import { DynamicCardRenderer } from '@/features/card-renderer/dynamic-card-renderer';
import { invalidateProgress, useStreak } from '@/features/progress';
import { useSchema, useTopicSchema } from '@/features/template-builder/api';
import { translate } from '@/lib/i18n';
import { invalidateStudy, useStudyQueue, useStudyToday, useSubmitStudyRating } from './api';

const RATINGS: { value: FsrsRating; tx: TxKeyPath; color: string; background: string }[] = [
  { value: 'AGAIN', tx: 'learn.session.rating_again', color: '#E11D48', background: 'bg-rose-50 dark:bg-rose-950/40' },
  { value: 'HARD', tx: 'learn.session.rating_hard', color: '#D97706', background: 'bg-amber-50 dark:bg-amber-950/40' },
  { value: 'GOOD', tx: 'learn.session.rating_good', color: '#059669', background: 'bg-emerald-50 dark:bg-emerald-950/40' },
  { value: 'EASY', tx: 'learn.session.rating_easy', color: '#0284C7', background: 'bg-sky-50 dark:bg-sky-950/40' },
];

const NO_STATS = { reviewed: 0, mastered: 0, xp: 0 };

/**
 * One study session. Without a collection/topic it is the Learn tab's session across the whole library
 * (learn_ui.md §9.1); the header tracks this session, not a daily quota.
 */
export function StudySessionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    collectionId?: string;
    collectionName?: string;
    topicId?: string;
    topicName?: string;
  }>();
  const collectionId = params.collectionId ? Number(params.collectionId) : undefined;
  const topicId = params.topicId ? Number(params.topicId) : undefined;
  const isToday = !collectionId && !topicId;
  const scope = React.useMemo(() => ({ collectionId, topicId }), [collectionId, topicId]);

  const queueQuery = useStudyQueue(scope);
  const submitRating = useSubmitStudyRating();
  const today = useStudyToday();
  const streak = useStreak().data?.currentStreak;
  const [removedCardIds, setRemovedCardIds] = React.useState<Set<number>>(() => new Set());
  const [side, setSide] = React.useState<CardSide>('FRONT');
  const [stats, setStats] = React.useState(NO_STATS);

  // Learn and Home refresh once when the learner leaves, not after every card.
  React.useEffect(() => () => {
    void invalidateStudy(queryClient);
    void invalidateProgress(queryClient);
  }, [queryClient]);

  const allCards = queueQuery.data?.cards ?? [];
  const cards = allCards.filter(card => !removedCardIds.has(card.item.topicItemId));
  const currentCard = cards[0];
  const total = allCards.length;
  const done = total - cards.length;
  const finished = total > 0 && !currentCard;

  // At the end, today's numbers decide whether to offer the next session.
  React.useEffect(() => {
    if (finished)
      void invalidateStudy(queryClient);
  }, [finished, queryClient]);

  const { data: topicSchema, isLoading: isTopicSchemaLoading } = useTopicSchema(currentCard?.topicId);
  const { data: fullSchema, isLoading: isFullSchemaLoading } = useSchema(topicSchema?.schemaId);
  const template = React.useMemo(
    () => fullSchema?.templates?.find(item => item.isDefault) ?? fullSchema?.templates?.[0],
    [fullSchema],
  );

  const dropCard = (topicItemId: number) => {
    setRemovedCardIds(previous => new Set(previous).add(topicItemId));
    setSide('FRONT');
  };

  const handleRate = async (rating: FsrsRating) => {
    if (!currentCard || submitRating.isPending)
      return;
    const topicItemId = currentCard.item.topicItemId;
    try {
      const result = await submitRating.mutateAsync({ ...scope, topicItemId, rating });
      setStats(s => ({
        reviewed: s.reviewed + 1,
        mastered: s.mastered + (result.becameMastered ? 1 : 0),
        xp: s.xp + result.xpAwarded,
      }));
      dropCard(topicItemId);
    }
    catch (error: any) {
      if (error?.response?.data?.error === 'DAILY_QUOTA_REACHED') {
        // Today's new words were used up elsewhere (another device or tab): skip, never block reviews.
        Alert.alert(translate('learn.session.new_limit_title'), translate('learn.session.new_limit_desc'));
        dropCard(topicItemId);
      }
      else {
        Alert.alert(translate('learn.session.save_error_title'), translate('learn.session.save_error_desc'));
      }
    }
  };

  const startNextSession = async () => {
    const result = await queueQuery.refetch();
    if (result.data) {
      setRemovedCardIds(new Set());
      setStats(NO_STATS);
      setSide('FRONT');
    }
  };

  const title = params.topicName || params.collectionName || translate('learn.session.today_title');
  const schemaLoading = Boolean(currentCard && (isTopicSchemaLoading || isFullSchemaLoading));

  if (queueQuery.isLoading) {
    return (
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }} className="flex-1 bg-[#F7F8F2] dark:bg-neutral-950">
        <View className="flex-1 items-center justify-center px-8">
          <Snapy pose="tap_trung" animation="idle" style={{ width: 120, height: 120 }} />
          <ActivityIndicator size="large" color="#16A34A" className="mt-4" />
          <Text className="mt-4 font-nunito text-lg font-black text-mascot-navy dark:text-white">
            {translate('learn.session.loading')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (queueQuery.isError) {
    return (
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }} className="flex-1 items-center justify-center bg-[#F7F8F2] p-6 dark:bg-neutral-950">
        <Snapy pose="bat_ngo" animation="none" style={{ width: 112, height: 112 }} />
        <Text className="mt-4 text-center font-nunito text-lg font-black text-mascot-navy dark:text-white">
          {translate('learn.session.queue_error')}
        </Text>
        <Button className="mt-5 px-6" label={translate('learn.session.retry')} variant="primary" onPress={() => void queueQuery.refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }} className="flex-1 bg-[#F7F8F2] dark:bg-neutral-950">
      <View className="bg-white px-4 pt-2 pb-4 dark:bg-neutral-900">
        <View className="flex-row items-center gap-3">
          <BackButton onPress={() => router.back()} className="mr-0.5" />
          <View className="flex-1">
            <Text className="font-nunito text-lg font-black text-mascot-navy dark:text-white" numberOfLines={1}>
              {title}
            </Text>
            {total > 0 && (
              <Text className="mt-0.5 font-inter text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                {translate('learn.session.progress', { done, total })}
              </Text>
            )}
          </View>
          {/* design.md §10.3: the streak stays visible during a session. */}
          {streak !== undefined && (
            <View className="flex-row items-center gap-1" accessibilityLabel={translate('learn.session.streak', { count: streak })}>
              <FlameIcon color="#F97316" width={18} height={18} />
              <Text className="font-nunito text-sm font-black text-mascot-navy dark:text-white">{streak}</Text>
            </View>
          )}
        </View>
        {total > 0 && (
          <View className="mt-3 h-3 overflow-hidden rounded-full border border-emerald-100 bg-emerald-50 dark:border-emerald-900 dark:bg-neutral-800">
            <View className="h-full rounded-full bg-emerald-500" style={{ width: `${(done / total) * 100}%` }} />
          </View>
        )}
      </View>

      {currentCard
        ? (
            <>
              <View className="flex-1 justify-center px-4 py-3">
                {isToday && (
                  <Text className="mb-2 font-inter text-xs font-bold text-neutral-400" numberOfLines={1}>
                    {currentCard.collectionName}
                  </Text>
                )}
                {schemaLoading
                  ? (
                      <View className="items-center py-12">
                        <ActivityIndicator color="#16A34A" />
                      </View>
                    )
                  : (
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
                      {translate('learn.session.show_answer')}
                    </Text>
                  </Pressable>
                )}
              </View>
              <View className="bg-white px-4 pt-3 pb-5 dark:bg-neutral-900">
                {side === 'BACK'
                  ? (
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
                            <Text style={{ color: rating.color }} className="font-nunito text-sm font-black">
                              {submitRating.isPending ? translate('learn.session.saving') : translate(rating.tx)}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    )
                  : (
                      <Text className="text-center font-inter text-xs font-semibold text-neutral-400">
                        {translate('learn.session.rate_prompt')}
                      </Text>
                    )}
              </View>
            </>
          )
        : finished
          ? (
              <SessionSummary
                stats={stats}
                next={isToday
                  ? (today.isFetching ? 0 : today.data?.sessionCount ?? 0)
                  // Scoped queues carry no totals: a full session means there may be more.
                  : (stats.reviewed >= (queueQuery.data?.limit ?? Infinity) ? -1 : 0)}
                onNext={startNextSession}
                onDone={() => router.back()}
              />
            )
          : (
              <View className="flex-1 items-center justify-center px-7">
                <Snapy pose="happy" animation="none" style={{ width: 112, height: 112 }} />
                <Text className="mt-5 text-center font-nunito text-2xl font-black text-mascot-navy dark:text-white">
                  {translate('learn.session.empty_title')}
                </Text>
                <Text className="mt-2 max-w-sm text-center font-inter text-sm/5 text-neutral-500 dark:text-neutral-400">
                  {translate(isToday ? 'learn.session.empty_today_desc' : 'learn.session.empty_scope_desc')}
                </Text>
                <Button className="mt-6 px-8" label={translate('learn.session.done')} variant="primary" onPress={() => router.back()} />
              </View>
            )}
    </SafeAreaView>
  );
}

type SummaryProps = {
  stats: typeof NO_STATS;
  /** Cards in the next session; -1 = more may exist but the count is unknown; 0 = nothing left. */
  next: number;
  onNext: () => void;
  onDone: () => void;
};

/** learn_ui.md §9.1: rewards live here, after the learning, each with its source (design.md §10.1). */
function SessionSummary({ stats, next, onNext, onDone }: SummaryProps) {
  return (
    <View className="flex-1 items-center justify-center px-7">
      <Snapy pose="proud" animation="bounce_in" style={{ width: 112, height: 112 }} />
      <Text className="mt-5 text-center font-nunito text-2xl font-black text-mascot-navy dark:text-white">
        {translate('learn.session.summary_title')}
      </Text>
      <Text className="mt-2 text-center font-inter text-sm text-neutral-500 dark:text-neutral-400">
        {translate('learn.session.summary_cards', { count: stats.reviewed })}
      </Text>
      {stats.mastered > 0 && (
        <Text className="mt-1 text-center font-inter text-sm font-bold text-reward-700">
          {translate('learn.session.summary_mastered', { count: stats.mastered })}
        </Text>
      )}
      {stats.xp > 0 && (
        <Text className="mt-1 text-center font-inter text-sm font-bold text-reward-700">
          {translate('learn.session.summary_xp', { xp: stats.xp, count: stats.reviewed })}
        </Text>
      )}
      <View className="mt-6 w-full max-w-sm gap-2">
        {next !== 0
          ? (
              <>
                <Button
                  label={next > 0 ? translate('learn.session.next_count', { count: next }) : translate('learn.session.next')}
                  variant="primary"
                  onPress={onNext}
                />
                <Button label={translate('learn.session.back_to_learn')} variant="ghost" onPress={onDone} />
              </>
            )
          : <Button label={translate('learn.session.done')} variant="primary" onPress={onDone} />}
      </View>
    </View>
  );
}

import type { ProgressSummaryDTO } from '../types';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import { deriveVocabularySegments, SRS_ENABLED } from '../utils';
import { LearningAction, MultiSegmentBar, StatValue } from './progress-primitives';

/** What the backend supports today: saved-word total and quizzes. Learning states need SRS. */
function SavedWordsCard({ totalWords }: { totalWords: number }) {
  const { t } = useTranslation();
  const empty = totalWords === 0;

  return (
    <View className="mb-3.5 gap-3 rounded-3xl border border-neutral-100 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
      <Text className="font-nunito text-sm font-bold text-neutral-500 dark:text-neutral-400">
        {t('progressUx.vocabulary')}
      </Text>
      <Text className="font-nunito text-2xl font-black text-neutral-900 dark:text-white">
        {t('progressUx.saved', { count: totalWords })}
      </Text>
      <Text className="font-inter text-xs text-neutral-400 dark:text-neutral-400">
        {t('progressUx.srsUnavailable')}
      </Text>
      <View className="border-t border-neutral-100 pt-3 dark:border-neutral-800">
        <LearningAction
          label={t(empty ? 'progressUx.exploreNewWords' : 'progressUx.startQuiz')}
          route={empty ? '/camera' : '/study/quiz-setup'}
        />
      </View>
    </View>
  );
}

export type LearningStateCardProps = {
  summary?: ProgressSummaryDTO;
  isLoading?: boolean;
};

export function LearningStateCard({ summary, isLoading }: LearningStateCardProps) {
  const { t } = useTranslation();

  if (isLoading || !summary) {
    return <View className="mb-5 h-44 rounded-3xl bg-neutral-200 dark:bg-neutral-800" />;
  }

  const {
    totalWords,
    learnedCount,
    newCount,
    learningAndReviewingCount,
    masteredCount,
  } = deriveVocabularySegments(summary);

  if (!SRS_ENABLED) {
    return <SavedWordsCard totalWords={totalWords} />;
  }

  const segments = [
    { value: newCount, color: '#9E7DFA', label: t('progressUx.unstudied') },
    {
      value: learningAndReviewingCount,
      color: '#FFA447',
      label: t('progressUx.learningAndReviewing'),
    },
    { value: masteredCount, color: '#58CC02', label: t('progressUx.mastered') },
  ];

  // CTA button configuration based on learner state. No "review due words" CTA until a review
  // flow exists: quiz-setup is a topic quiz and does not touch the due queue.
  let ctaLabel: string;
  let ctaRoute: string;

  if (totalWords === 0) {
    ctaLabel = t('progressUx.exploreNewWords');
    ctaRoute = '/camera';
  }
  else if (newCount > 0) {
    ctaLabel = t('progressUx.studySaved');
    ctaRoute = '/(app)/(tabs)/learn';
  }
  else {
    ctaLabel = t('progressUx.startQuiz');
    ctaRoute = '/study/quiz-setup';
  }

  return (
    <View className="mb-3.5 gap-3.5 rounded-3xl border border-neutral-100 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
      {/* Section Header */}
      <Text className="font-nunito text-sm font-bold text-neutral-500 dark:text-neutral-400">
        {t('progressUx.vocabulary')}
      </Text>

      {/* Main Count & Progress Ratio */}
      <View className="flex-row items-baseline justify-between">
        <Text className="font-nunito text-2xl font-black text-neutral-900 dark:text-white">
          {t('progressUx.saved', { count: totalWords })}
        </Text>
        <Text className="font-inter text-xs font-semibold text-neutral-400 dark:text-neutral-400">
          {t('progressUx.studiedRatio', { learned: learnedCount, total: totalWords })}
        </Text>
      </View>

      {/* Status Distribution Header & Bar */}
      <View className="gap-2">
        <Text className="font-inter text-xs font-semibold text-neutral-500 dark:text-neutral-400">
          {t('progressUx.vocabularyDistribution')}
        </Text>
        <MultiSegmentBar segments={segments} label={t('progressUx.vocabularyDistribution')} />
      </View>

      {/* 3 Metric Breakdown with Color Dots */}
      <View className="flex-row items-center justify-between pt-1">
        <StatValue
          value={newCount}
          label={t('progressUx.unstudied')}
          dotColor="#9E7DFA"
        />
        <StatValue
          value={learningAndReviewingCount}
          label={t('progressUx.learningAndReviewing')}
          dotColor="#FFA447"
        />
        <StatValue
          value={masteredCount}
          label={t('progressUx.mastered')}
          dotColor="#58CC02"
        />
      </View>

      {/* Footnote Derivation */}
      <Text className="font-inter text-xs text-neutral-400 dark:text-neutral-400">
        {t('progressUx.learningAndReviewingExplanation')}
      </Text>

      {/* Action CTA */}
      <View className="border-t border-neutral-100 pt-3 dark:border-neutral-800">
        <LearningAction label={ctaLabel} route={ctaRoute} />
      </View>
    </View>
  );
}

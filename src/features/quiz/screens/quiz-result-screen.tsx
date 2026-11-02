/* eslint-disable max-lines-per-function */
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckCircleIcon,
  HomeIcon,
  RotateCcwIcon,
  SparklesIcon,
  XCircleIcon,
} from '@/components/ui/icons';
import { RewardIcon } from '@/components/ui/rewards/reward-icon';
import { Snapy } from '@/components/ui/snapy';
import { QuizResultBadgeRow } from '@/features/badges';
import { translate } from '@/lib/i18n';
import { useQuizResult } from '../api/quiz-api';
import { formatQuizAccuracy, formatQuizDuration } from '../utils';

const { height, width } = Dimensions.get('window');

export function QuizResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams<{
    quizId?: string;
  }>();

  const quizId = params.quizId ? Number(params.quizId) : null;
  const { data: result, isLoading, refetch } = useQuizResult(quizId);

  const summary = result?.summary;
  const score = summary?.correctCount ?? 0;
  const total = summary?.totalUnits ?? 0;
  const accuracy = summary ? formatQuizAccuracy(summary.accuracy) : 0;
  const topicName = result?.topicName || translate('quiz.default_topic');
  const direction = result?.direction || 'EN_VI';

  const wrongAnswers = result?.items?.filter(i => i.outcome === 'INCORRECT') || [];
  const isPerfect = wrongAnswers.length === 0 && score > 0;
  const xpEarned = result?.xp?.amount ?? 0;
  const xpBonus = result?.xp?.bonusAmount ?? 0;

  // Animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reward Pop-in
    Animated.sequence([
      Animated.delay(200),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();

    // Confetti Fall
    Animated.timing(confettiAnim, {
      toValue: 1,
      duration: 2200,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [confettiAnim, fadeAnim, scaleAnim]);

  // Simple Confetti Generator
  const renderConfetti = () => {
    const pieces = Array.from({ length: 22 }).map((_, i) => {
      const left = Math.random() * width;
      const size = Math.random() * 8 + 6;
      const rotate = Math.random() * 360;
      const colors = ['#58CC02', '#1CB0F6', '#FFC42E', '#FF8A00', '#2B70C9'];
      const color = colors[i % colors.length];

      const translateY = confettiAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-50, height + 50],
      });
      const rotateInterpolate = confettiAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [`${rotate}deg`, `${rotate + 360}deg`],
      });

      return (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left,
            top: -50,
            width: size,
            height: size,
            backgroundColor: color,
            borderRadius: 3,
            transform: [{ translateY }, { rotate: rotateInterpolate }],
            opacity: confettiAnim.interpolate({
              inputRange: [0, 0.8, 1],
              outputRange: [1, 1, 0],
            }),
          }}
        />
      );
    });

    return <View className="pointer-events-none absolute inset-0 z-50 overflow-hidden">{pieces}</View>;
  };

  const handleGoHome = () => {
    router.replace('/(app)/(tabs)/learn' as any);
  };

  const handleGoHistory = () => {
    router.push('/(app)/study/quiz-history' as any);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#3B82F6" className="mb-4" />
        <Text className="font-nunito text-[16px] font-extrabold text-mascot-navy dark:text-neutral-50">
          {translate('quiz.result_loading')}
        </Text>
      </SafeAreaView>
    );
  }

  // No server result (e.g. QUIZ_NOT_FINISHED): never render a fake 0/0 completion.
  if (!result) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-background px-6">
        <Text className="text-center font-nunito text-[16px] font-extrabold text-mascot-navy dark:text-neutral-50">
          {translate('quiz.result_error')}
        </Text>
        <Pressable onPress={() => void refetch()} className="min-h-12 justify-center rounded-2xl bg-primary-800 px-6 active:opacity-80">
          <Text className="font-nunito text-[15px] font-extrabold text-white">{translate('quiz.retry')}</Text>
        </Pressable>
        <Pressable onPress={handleGoHome} className="min-h-12 justify-center px-6 active:opacity-60">
          <Text className="font-nunito text-[15px] font-extrabold text-mascot-navy dark:text-neutral-50">{translate('quiz.home')}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // Only a COMPLETED quiz has a final score (summary is null otherwise): never show a cancelled or
  // expired session as a 0/0 completion.
  if (result.status !== 'COMPLETED' || !summary) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-background px-6">
        <Snapy pose="suy_nghi" animation="idle" style={{ width: 110, height: 110 }} />
        <Text className="text-center font-nunito text-[20px] font-extrabold text-mascot-navy dark:text-neutral-50">
          {result.status === 'CANCELLED' ? translate('quiz.cancelled_title') : translate('quiz.error_expired_title')}
        </Text>
        <Text className="text-center font-inter text-[14px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          {topicName}
          {' · '}
          {translate('quiz.not_graded')}
        </Text>
        <Pressable onPress={handleGoHistory} className="min-h-12 justify-center rounded-2xl bg-primary-800 px-6 active:opacity-80">
          <Text className="font-nunito text-[15px] font-extrabold text-white">{translate('quiz.history_title')}</Text>
        </Pressable>
        <Pressable onPress={handleGoHome} className="min-h-12 justify-center px-6 active:opacity-60">
          <Text className="font-nunito text-[15px] font-extrabold text-mascot-navy dark:text-neutral-50">{translate('quiz.home')}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>

      {/* 1. CONFETTI (Background overlay) */}
      {renderConfetti()}

      <ScrollView
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. CELEBRATION HEADER */}
        <View className="items-center pt-6 pb-4">
          <View className="relative items-center justify-center">
            <View className="absolute size-44 rounded-full bg-warning-200/50 blur-2xl dark:bg-warning-500/15" />
            <Snapy
              pose={isPerfect ? 'tu_hao' : accuracy >= 80 ? 'an_mung' : 'suy_nghi'}
              animation={isPerfect ? 'celebrate' : 'bounce'}
              style={{ width: 130, height: 130 }}
              className="z-10 mb-2"
            />
          </View>
          <Text className="px-4 text-center font-nunito text-[28px] leading-tight font-extrabold text-mascot-navy dark:text-neutral-50">
            {isPerfect ? translate('quiz.perfect') : accuracy >= 70 ? translate('quiz.completed_well') : translate('quiz.completed')}
          </Text>
          <Text className="mt-1 px-4 text-center font-inter text-[15px] font-bold text-neutral-500 dark:text-neutral-400">
            {isPerfect
              ? translate('quiz.perfect_body')
              : translate('quiz.completed_body')}
          </Text>
        </View>

        {/* 3. SCORE (learning result leads, rewards follow) */}
        <View className="mb-5 items-center">
          {/* Topic & Direction Info Badge */}
          <View className="mb-3 flex-row items-center gap-2">
            <View className="rounded-full border border-line bg-surface px-3 py-1 shadow-sm">
              <Text className="font-nunito text-[12px] font-bold text-mascot-navy dark:text-neutral-50">
                {topicName}
              </Text>
            </View>
            <View className="rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 dark:border-primary-500/40 dark:bg-primary-500/15">
              <Text className="font-inter text-[11px] font-bold text-primary-700 dark:text-primary-300">
                {direction === 'VI_EN' ? translate('quiz.direction_vi_en') : translate('quiz.direction_en_vi')}
              </Text>
            </View>
          </View>

          <Text className="font-nunito text-[40px] leading-tight font-extrabold text-mascot-navy dark:text-neutral-50">
            {score}
            {' '}
            /
            {total}
          </Text>
          <Text className="font-inter text-[15px] font-bold text-neutral-500 dark:text-neutral-400">
            {translate('quiz.accuracy_label')}
            {' '}
            {accuracy}
            %
          </Text>
        </View>

        {/* 4. REWARD CENTERPIECE (Honest: no fabricated rewards until M4) */}
        <Animated.View
          style={{ transform: [{ scale: scaleAnim }], opacity: scaleAnim }}
          className="mx-6 mb-7 items-center rounded-[24px] border-2 border-b-[6px] border-line bg-surface p-6 shadow-sm shadow-black/5"
        >
          <Text className="mb-4 font-inter text-[12px] font-extrabold tracking-widest text-neutral-400 uppercase">
            {translate('quiz.rewards_heading')}
          </Text>

          <View className="mb-6 w-full flex-row items-center justify-center gap-10">
            <View className="items-center">
              <View className="mb-2 size-14 items-center justify-center rounded-2xl border border-line bg-surface-raised">
                <RewardIcon type="xp" size={42} />
              </View>
              <Text className={`font-nunito text-[16px] font-extrabold ${xpEarned > 0 ? 'text-primary-600 dark:text-primary-300' : 'text-neutral-400'}`}>
                +
                {xpEarned}
                {' '}
                XP
              </Text>
              {xpBonus > 0 && (
                <Text className="mt-0.5 font-inter text-[11px] font-bold text-reward-600 dark:text-reward-300">
                  {translate('quiz.xp_booster_bonus', { amount: xpBonus })}
                </Text>
              )}
            </View>
          </View>

          <View className="w-full flex-row items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-500/40 dark:bg-amber-500/15">
            <SparklesIcon size={18} className="text-amber-600 dark:text-amber-300" />
            <Text className="text-center font-inter text-[13px] font-medium text-amber-800 dark:text-amber-300">
              {translate('quiz.coins_from_missions')}
            </Text>
          </View>
          <QuizResultBadgeRow />
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <View className="mx-6 mb-7 rounded-3xl border-2 border-line bg-surface p-5 shadow-sm shadow-black/5">
            <View className="flex-row">
              <View className="flex-1 items-center border-r border-b border-line pr-2 pb-4">
                <Text className="font-nunito text-[24px] font-extrabold text-success-600 dark:text-success-300">{score}</Text>
                <Text className="font-inter text-[13px] font-bold text-neutral-500 dark:text-neutral-400">{translate('quiz.correct')}</Text>
              </View>
              <View className="flex-1 items-center border-b border-line pb-4 pl-2">
                <Text className="font-nunito text-[24px] font-extrabold text-error-600 dark:text-error-300">{total - score}</Text>
                <Text className="font-inter text-[13px] font-bold text-neutral-500 dark:text-neutral-400">{translate('quiz.incorrect')}</Text>
              </View>
            </View>
            <View className="flex-row pt-4">
              <View className="flex-1 items-center border-r border-line pr-2">
                <Text className="font-nunito text-[20px] font-extrabold text-mascot-navy dark:text-neutral-50">
                  {accuracy}
                  %
                </Text>
                <Text className="font-inter text-[13px] font-bold text-neutral-500 dark:text-neutral-400">{translate('quiz.accuracy')}</Text>
              </View>
              <View className="flex-1 items-center pl-2">
                <Text className="font-nunito text-[20px] font-extrabold text-mascot-navy dark:text-neutral-50">
                  {formatQuizDuration(result?.durationSeconds)}
                </Text>
                <Text className="font-inter text-[13px] font-bold text-neutral-500 dark:text-neutral-400">{translate('quiz.duration')}</Text>
              </View>
            </View>
          </View>

          {/* 5. WRONG ANSWERS SECTION */}
          {wrongAnswers.length > 0 ? (
            <View className="mb-8 px-6">
              <Text className="mb-1 font-nunito text-[18px] font-extrabold text-mascot-navy dark:text-neutral-50">{translate('quiz.review_section')}</Text>
              <Text className="mb-4 font-inter text-[13px] font-bold text-neutral-500 dark:text-neutral-400">
                {translate('quiz.review_count_prefix')}
                {' '}
                {wrongAnswers.length}
                {' '}
                {translate('quiz.review_count_suffix')}
              </Text>

              <View className="gap-3">
                {wrongAnswers.map((wrong, idx) => (
                  <View key={wrong.questionId || `w_${idx}`} className="rounded-2xl border-2 border-error-100 bg-surface p-4 shadow-sm shadow-black/5 dark:border-error-500/40">
                    <Text className="mb-2.5 font-nunito text-[18px] font-extrabold text-mascot-navy dark:text-neutral-50">
                      {wrong.prompt}
                    </Text>
                    <View className="gap-2">
                      <View className="flex-row items-start gap-2.5">
                        <View className="mt-0.5 size-5 items-center justify-center rounded-full border border-success-200 bg-success-100 dark:border-success-500/40 dark:bg-success-500/15">
                          <CheckCircleIcon size={14} className="text-success-600 dark:text-success-300" />
                        </View>
                        <Text className="flex-1 font-inter text-[14px] font-medium text-neutral-600 dark:text-neutral-300">
                          {translate('quiz.correct_answer')}
                          {' '}
                          <Text className="font-bold text-success-700 dark:text-success-300">{wrong.correctAnswer}</Text>
                        </Text>
                      </View>
                      {wrong.learnerAnswer && (
                        <View className="flex-row items-start gap-2.5">
                          <View className="mt-0.5 size-5 items-center justify-center rounded-full border border-error-200 bg-error-100 dark:border-error-500/40 dark:bg-error-500/15">
                            <XCircleIcon size={14} className="text-error-600 dark:text-error-300" />
                          </View>
                          <Text className="flex-1 font-inter text-[14px] font-medium text-neutral-600 dark:text-neutral-300">
                            {translate('quiz.your_answer')}
                            {' '}
                            <Text className="font-bold text-error-700 dark:text-error-300">{wrong.learnerAnswer}</Text>
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View className="mx-6 mb-8 items-center rounded-3xl border-2 border-success-200 bg-success-50/90 p-6 dark:border-success-500/40 dark:bg-success-500/15">
              <View className="mb-3 size-12 items-center justify-center rounded-2xl bg-success-500 shadow-md shadow-success-500/20">
                <SparklesIcon size={24} className="text-white" />
              </View>
              <Text className="text-center font-nunito text-[19px] font-extrabold text-success-800 dark:text-success-300">
                {translate('quiz.perfect_accuracy')}
              </Text>
              <Text className="mt-1 text-center font-inter text-[13px] font-medium text-success-700 dark:text-success-300">
                {translate('quiz.all_correct_body')}
              </Text>
            </View>
          )}

        </Animated.View>
      </ScrollView>

      {/* 6. BOTTOM ACTIONS */}
      <View
        style={{ bottom: insets.bottom }}
        className="absolute inset-x-0 flex-row gap-3 border-t border-line bg-surface p-4 shadow-lg shadow-black/5"
      >
        <Pressable
          onPress={handleGoHome}
          className="h-13 flex-1 flex-row items-center justify-center gap-2 rounded-2xl border-b-4 border-line bg-muted active:translate-y-px active:border-b-2 active:bg-pressed"
        >
          <HomeIcon size={20} className="text-neutral-700 dark:text-neutral-200" />
          <Text className="font-nunito text-[15px] font-extrabold text-neutral-700 uppercase dark:text-neutral-200">
            {translate('quiz.home')}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleGoHistory}
          className="h-13 flex-1 flex-row items-center justify-center gap-2 rounded-2xl border-b-4 border-brand-edge bg-brand active:translate-y-px active:border-b-2 active:bg-brand-pressed"
        >
          <RotateCcwIcon size={20} className="text-on-brand" />
          <Text className="font-nunito text-[15px] font-extrabold text-on-brand uppercase">
            {translate('quiz.history_title')}
          </Text>
        </Pressable>
      </View>

    </SafeAreaView>
  );
}

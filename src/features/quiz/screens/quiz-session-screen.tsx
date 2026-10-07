import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Snapy } from '@/components/ui/snapy';
import { translate } from '@/lib/i18n';
import { useQuiz } from '../api/quiz-api';
import { FillBlankQuizView } from '../components/fill-blank-quiz-view';
import { MatchingQuizView } from '../components/matching-quiz-view';
import { MultipleChoiceQuizView } from '../components/multiple-choice-quiz-view';
import { isQuizSessionExpired } from '../utils';

export function QuizSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    quizId?: string;
  }>();

  const quizId = params.quizId ? Number(params.quizId) : null;

  // Safe navigation back
  const navigateBackSafely = () => {
    try {
      if (router && typeof router.canGoBack === 'function' && router.canGoBack()) {
        router.back();
      }
      else {
        router.replace('/(app)/(tabs)/learn' as any);
      }
    }
    catch {
      router.replace('/(app)/(tabs)/learn' as any);
    }
  };

  const { data: quiz, isLoading, isError, error, refetch } = useQuiz(quizId);
  const expired = isQuizSessionExpired(error);

  // 1. LOADING STATE
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F7F8FA] p-6 dark:bg-neutral-900">
        <Snapy pose="tap_trung" animation="idle" style={{ width: 120, height: 120 }} className="mb-6" />
        <ActivityIndicator size="large" color="#3B82F6" className="mb-4" />
        <Text className="text-center font-nunito text-[18px] font-black text-mascot-navy dark:text-white">
          {translate('quiz.loading_title')}
        </Text>
        <Text className="mt-1 text-center font-inter text-[13px] font-medium text-neutral-400">
          {translate('quiz.loading_desc')}
        </Text>
      </SafeAreaView>
    );
  }

  // 2. ERROR / NOT FOUND STATE
  if (isError || !quiz) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F7F8FA] p-6 dark:bg-neutral-900">
        <Snapy pose="bat_ngo" animation="shake" style={{ width: 120, height: 120 }} className="mb-6" />
        <Text className="text-center font-nunito text-[20px] font-black text-mascot-navy dark:text-white">
          {expired ? translate('quiz.error_expired_title') : translate('quiz.error_generic_title')}
        </Text>
        <Text className="mt-2 mb-6 px-6 text-center font-inter text-[14px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          {expired ? translate('quiz.error_expired_desc') : translate('quiz.error_generic_desc')}
        </Text>

        <View className="w-full max-w-xs gap-3">
          {/* Retrying an expired session can never succeed, so offer a new quiz instead (D16). */}
          <Pressable
            onPress={() => (expired
              ? router.replace('/(app)/study/quiz-setup' as any)
              : refetch())}
            className="h-13 w-full items-center justify-center rounded-2xl border-b-4 border-primary-700 bg-primary-500 active:translate-y-[2px] active:border-b-2"
          >
            <Text className="font-nunito text-[15px] font-black tracking-wider text-white uppercase">
              {expired ? translate('quiz.btn_new_quiz') : translate('quiz.retry')}
            </Text>
          </Pressable>

          <Pressable
            onPress={navigateBackSafely}
            className="h-13 w-full items-center justify-center rounded-2xl border-2 border-b-4 border-neutral-200 border-b-neutral-300 bg-white active:translate-y-[2px] active:border-b-2 dark:border-neutral-700 dark:border-b-neutral-800 dark:bg-neutral-800"
          >
            <Text className="font-nunito text-[15px] font-black tracking-wider text-neutral-700 uppercase dark:text-neutral-200">
              {translate('quiz.btn_back')}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // 3. RENDER ACTIVE QUIZ MODE
  if (quiz.mode === 'MATCHING') {
    return <MatchingQuizView quiz={quiz} onExit={navigateBackSafely} />;
  }

  if (quiz.mode === 'FILL_BLANK') {
    return <FillBlankQuizView quiz={quiz} onExit={navigateBackSafely} />;
  }

  return <MultipleChoiceQuizView quiz={quiz} onExit={navigateBackSafely} />;
}

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
import { useFinishQuiz } from '../hooks/use-finish-quiz';
import { isQuizFullyResolved, isQuizSessionExpired } from '../utils';

type NoticeAction = { label: string; onPress: () => void; busy?: boolean };

function SessionNotice({ title, message, primary, onBack }: {
  title: string;
  message: string;
  primary: NoticeAction;
  onBack: () => void;
}) {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-[#F7F8FA] p-6">
      <Snapy pose="bat_ngo" animation="shake" style={{ width: 120, height: 120 }} className="mb-6" />
      <Text className="text-center font-nunito text-[20px] font-extrabold text-mascot-navy">{title}</Text>
      <Text className="mt-2 mb-6 px-6 text-center font-inter text-[14px] leading-relaxed text-neutral-500">{message}</Text>

      <View className="w-full max-w-xs gap-3">
        <Pressable
          onPress={primary.onPress}
          disabled={primary.busy}
          className="h-12 w-full items-center justify-center rounded-xl border-b-2 border-primary-700 bg-primary-500 active:bg-primary-600"
        >
          {primary.busy
            ? <ActivityIndicator size="small" color="#FFFFFF" />
            : <Text className="font-nunito text-[15px] font-extrabold text-white">{primary.label}</Text>}
        </Pressable>

        <Pressable
          onPress={onBack}
          className="h-12 w-full items-center justify-center rounded-xl bg-neutral-200 active:bg-neutral-300"
        >
          <Text className="font-nunito text-[15px] font-extrabold text-neutral-700">{translate('quiz.btn_back')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

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

  const { data: quiz, isError, error, refetch, isFetchedAfterMount } = useQuiz(quizId);
  const expired = isQuizSessionExpired(error);

  // Views seed their position from the Play DTO once, so they must mount on server-fresh state and
  // remount after a resync (server moved on: graded elsewhere, terminal, unresolved units).
  const [epoch, setEpoch] = React.useState(0);
  const resync = React.useCallback(() => {
    void refetch().then(() => setEpoch(e => e + 1));
  }, [refetch]);
  const finishQuiz = useFinishQuiz(quizId ?? 0, resync);

  // 1. LOADING STATE — cached Play data may be stale (answers made since), so wait for a fresh fetch.
  if (quizId !== null && !isFetchedAfterMount && !isError) {
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

  // 2. ERROR / NOT FOUND STATE — retrying an expired session can never succeed, so offer a new quiz (D17).
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

  // 3. TERMINAL SESSION — never offer answering on a finished quiz.
  if (quiz.status === 'COMPLETED') {
    return (
      <SessionNotice
        title={translate('quiz.session_completed_title')}
        message={translate('quiz.session_completed_body')}
        primary={{
          label: translate('quiz.see_result'),
          onPress: () => router.replace({ pathname: '/(app)/study/quiz-result' as any, params: { quizId: String(quiz.quizId) } }),
        }}
        onBack={navigateBackSafely}
      />
    );
  }
  if (quiz.status !== 'IN_PROGRESS') {
    return (
      <SessionNotice
        title={quiz.status === 'CANCELLED' ? translate('quiz.cancelled_title') : translate('quiz.error_expired_title')}
        message={translate('quiz.session_unavailable_body')}
        primary={{ label: translate('quiz.btn_new_quiz'), onPress: () => router.replace('/(app)/study/quiz-setup' as any) }}
        onBack={navigateBackSafely}
      />
    );
  }

  // 4. EVERY UNIT RESOLVED BUT NOT COMPLETED (resume after a failed complete).
  if (isQuizFullyResolved(quiz)) {
    return (
      <SessionNotice
        title={translate('quiz.all_questions_done')}
        message={translate('quiz.finish_to_save')}
        primary={{ label: translate('quiz.finish_quiz'), onPress: finishQuiz.finish, busy: finishQuiz.isPending }}
        onBack={navigateBackSafely}
      />
    );
  }

  // 5. RENDER ACTIVE QUIZ MODE
  const viewProps = { quiz, onExit: navigateBackSafely, onResync: resync };
  if (quiz.mode === 'MATCHING') {
    return <MatchingQuizView key={epoch} {...viewProps} />;
  }

  if (quiz.mode === 'FILL_BLANK') {
    return <FillBlankQuizView key={epoch} {...viewProps} />;
  }

  return <MultipleChoiceQuizView key={epoch} {...viewProps} />;
}

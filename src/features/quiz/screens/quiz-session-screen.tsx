import type { FillBlankResult } from '../components/fill-blank-quiz-view';
import type { MatchingResult } from '../components/matching-quiz-view';
import type { MultipleChoiceResult } from '../components/multiple-choice-quiz-view';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { FillBlankQuizView } from '../components/fill-blank-quiz-view';
import { MatchingQuizView } from '../components/matching-quiz-view';
import { MultipleChoiceQuizView } from '../components/multiple-choice-quiz-view';

export function QuizSessionScreen() {
  const router = useRouter();
  const rawParams = useLocalSearchParams<{
    topicId?: string;
    topicName?: string;
    deckId?: string;
    mode?: string;
    count?: string;
    direction?: 'EN_VI' | 'VI_EN';
    reviewWrong?: string;
    wrongData?: string;
    quizId?: string;
  }>();
  const params = rawParams || {};

  // Safe navigation back to avoid broken history
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

  const currentTopicId = params.topicId || params.deckId || 't1';
  const currentTopicName = params.topicName || 'Chủ đề từ vựng';
  const currentDirection = params.direction === 'VI_EN' ? 'VI_EN' : 'EN_VI';

  // Generic completion router
  const handleGenericComplete = (result: {
    score: number;
    total: number;
    xp: number;
    coin: number;
    time: string;
    topicId?: string;
    topicName?: string;
    deckId?: string;
    mode: string;
    direction?: 'EN_VI' | 'VI_EN';
    wrongAnswers: any[];
  }) => {
    const targetRoute = {
      pathname: '/(app)/study/quiz-result' as any,
      params: {
        score: String(result.score),
        total: String(result.total),
        xp: String(result.xp),
        coin: String(result.coin),
        time: result.time,
        topicId: result.topicId || currentTopicId,
        topicName: result.topicName || currentTopicName,
        deckId: result.deckId || currentTopicId,
        mode: result.mode,
        direction: result.direction || currentDirection,
        wrongAnswers: JSON.stringify(result.wrongAnswers),
      },
    };

    try {
      router.replace(targetRoute as any);
    }
    catch {
      // fallback
    }
  };

  const parsedCount = Number.parseInt(params.count || '5', 10) || 5;
  const isReviewWrong = params.reviewWrong === 'true';

  if (params.mode === 'MATCHING') {
    return (
      <MatchingQuizView
        count={parsedCount}
        reviewWrong={isReviewWrong}
        wrongData={params.wrongData}
        onExit={navigateBackSafely}
        onComplete={(res: MatchingResult) =>
          handleGenericComplete({
            ...res,
            topicId: currentTopicId,
            topicName: currentTopicName,
            deckId: currentTopicId,
            direction: currentDirection,
            mode: 'MATCHING',
          })}
      />
    );
  }

  if (params.mode === 'FILL_BLANK') {
    return (
      <FillBlankQuizView
        count={parsedCount}
        reviewWrong={isReviewWrong}
        wrongData={params.wrongData}
        onExit={navigateBackSafely}
        onComplete={(res: FillBlankResult) =>
          handleGenericComplete({
            ...res,
            topicId: currentTopicId,
            topicName: currentTopicName,
            deckId: currentTopicId,
            direction: currentDirection,
            mode: 'FILL_BLANK',
          })}
      />
    );
  }

  return (
    <MultipleChoiceQuizView
      topicId={currentTopicId}
      topicName={currentTopicName}
      deckId={currentTopicId}
      count={parsedCount}
      direction={currentDirection}
      reviewWrong={isReviewWrong}
      wrongData={params.wrongData}
      onExit={navigateBackSafely}
      onComplete={(res: MultipleChoiceResult) =>
        handleGenericComplete({
          ...res,
          topicId: currentTopicId,
          topicName: currentTopicName,
          deckId: currentTopicId,
          direction: currentDirection,
          mode: 'MULTIPLE_CHOICE',
        })}
    />
  );
}

/* eslint-disable max-lines-per-function */
import type { QuizPlayDTO } from '../types';
import type { SnapyPose } from '@/components/ui/snapy';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Easing,
  Pressable,
  Animated as RNAnimated,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  CloseIcon,
  EditIcon,
  VolumeIcon,
  XCircleIcon,
} from '@/components/ui/icons';
import { Snapy } from '@/components/ui/snapy';
import { useTts } from '@/lib/hooks/use-tts';
import { translate } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useCheckQuestion } from '../api/quiz-api';
import { useExpiredSessionHandler } from '../hooks/use-expired-session-handler';
import { useFinishQuiz } from '../hooks/use-finish-quiz';
import { classifyQuizError, firstUnresolvedIndex } from '../utils';
import { generateIdempotencyKey } from '../utils/idempotency';
import { QuizExitModal } from './quiz-exit-modal';

export type FillBlankQuizViewProps = {
  quiz: QuizPlayDTO;
  onExit: () => void;
  /** Reload the session from the server when it moved on (graded elsewhere, terminal). */
  onResync: () => void;
};

export function FillBlankQuizView({ quiz, onExit, onResync }: FillBlankQuizViewProps) {
  const { width } = Dimensions.get('window');
  const questions = quiz.questions || [];

  // Resume at the first question the server has not graded (D18); the Session screen handles "all graded".
  const [currentIndex, setCurrentIndex] = useState(() => Math.max(0, firstUnresolvedIndex(questions)));
  const [inputText, setInputText] = useState('');
  const [checkState, setCheckState] = useState<'IDLE' | 'CORRECT' | 'INCORRECT'>('IDLE');
  const [correctAnswerText, setCorrectAnswerText] = useState<string>('');
  const [showExitModal, setShowExitModal] = useState(false);
  const { speak, isPlaying: isSpeaking } = useTts();
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => generateIdempotencyKey());
  // UNCONFIRMED: the check may have been committed, so the answer stays locked until the same
  // request (same key + same text) is confirmed. REJECTED: nothing was written, edit and resend.
  const [answerNotice, setAnswerNotice] = useState<'UNCONFIRMED' | 'REJECTED' | null>(null);
  const answerLocked = answerNotice === 'UNCONFIRMED';
  const advancingRef = useRef(false);

  // Live Stopwatch State
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Mascot state
  const [mascotPose, setMascotPose] = useState<SnapyPose>('tap_trung');
  const [mascotAnim, setMascotAnim] = useState<string>('idle');
  const [bubbleText, setBubbleText] = useState(translate('quiz.fill_prompt'));

  // Animation references
  const slideAnim = useRef(new RNAnimated.Value(0)).current;
  const shakeAnim = useRef(new RNAnimated.Value(0)).current;
  const bottomBarAnim = useRef(new RNAnimated.Value(0)).current;

  const currentQ = questions[currentIndex] || questions[0];
  const progressPercent = questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;

  const nextIndex = firstUnresolvedIndex(questions, currentIndex);

  const checkMutation = useCheckQuestion();
  const finishQuiz = useFinishQuiz(quiz.quizId, onResync);
  const handleExpiredSession = useExpiredSessionHandler();

  // Play sentence audio
  const handlePlayAudio = () => {
    if (!currentQ?.prompt)
      return;
    speak(currentQ.prompt.replace(/_____/g, 'blank'));
  };

  // Check Answer
  const handleCheck = () => {
    if (!inputText.trim() || checkState !== 'IDLE' || checkMutation.isPending || !currentQ)
      return;

    checkMutation.mutate(
      {
        questionId: currentQ.questionId,
        data: { answer: inputText.trim() },
        idempotencyKey,
      },
      {
        onSuccess: (data) => {
          const isCorrect = data.correct;
          setAnswerNotice(null);
          setCheckState(isCorrect ? 'CORRECT' : 'INCORRECT');
          setCorrectAnswerText(data.correctAnswer);

          if (isCorrect) {
            setMascotPose('an_mung');
            setMascotAnim('celebrate');
            setBubbleText(translate('quiz.fill_correct'));
            if (data.correctAnswer) {
              speak(currentQ.prompt.replace(/_____/g, data.correctAnswer));
            }
          }
          else {
            setMascotPose('bat_ngo');
            setMascotAnim('shake');
            setBubbleText(translate('quiz.fill_incorrect'));

            // Shake animation on the card
            shakeAnim.setValue(0);
            RNAnimated.sequence([
              RNAnimated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
              RNAnimated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
              RNAnimated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
              RNAnimated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
              RNAnimated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
            ]).start();
          }

          // Spring animate bottom drawer
          bottomBarAnim.setValue(0);
          RNAnimated.spring(bottomBarAnim, {
            toValue: 1,
            friction: 6,
            tension: 40,
            useNativeDriver: true,
          }).start();
        },
        onError: (error) => {
          if (handleExpiredSession(error))
            return;
          const kind = classifyQuizError(error);
          if (kind === 'RESYNC') {
            onResync();
          }
          else if (kind === 'REJECTED') {
            setIdempotencyKey(generateIdempotencyKey());
            setAnswerNotice('REJECTED');
          }
          else {
            setAnswerNotice('UNCONFIRMED'); // same key + same locked text on retry
          }
        },
      },
    );
  };

  // Advance to next question or complete
  const handleNext = () => {
    // A second tap during the slide would advance twice and skip a question.
    if (advancingRef.current)
      return;
    if (nextIndex === -1) {
      finishQuiz.finish();
      return;
    }
    advancingRef.current = true;

    // Slide out
    RNAnimated.timing(slideAnim, {
      toValue: -width,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setCurrentIndex(nextIndex);
      advancingRef.current = false;
      setInputText('');
      setCheckState('IDLE');
      setCorrectAnswerText('');
      setIdempotencyKey(generateIdempotencyKey());
      setMascotPose('tap_trung');
      setMascotAnim('idle');
      setBubbleText(translate('quiz.fill_prompt'));
      bottomBarAnim.setValue(0);

      // Slide in
      slideAnim.setValue(width);
      RNAnimated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    });
  };

  const translateY = bottomBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [140, 0],
  });

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background" edges={['top', 'bottom']}>

      {/* 1. TOP BAR */}
      <View className="z-10 flex-row items-center justify-between border-b border-line bg-background px-4 py-3">
        <TouchableOpacity
          onPress={() => setShowExitModal(true)}
          accessibilityRole="button"
          accessibilityLabel={translate('quiz.exit')}
          hitSlop={8}
          activeOpacity={0.7}
          className="-ml-2 size-10 items-center justify-center rounded-full"
        >
          <CloseIcon size={24} className="text-neutral-500 dark:text-neutral-400" />
        </TouchableOpacity>

        <View className="mx-3 flex-1">
          <View className="h-3 w-full overflow-hidden rounded-full bg-line">
            <View
              className="h-full rounded-full bg-amber-500"
              style={{
                width: `${
                  checkState === 'IDLE'
                    ? progressPercent
                    : ((currentIndex + 1) / questions.length) * 100
                }%`,
              }}
            />
          </View>
        </View>

        {/* Live Stopwatch Badge */}
        <View className="mr-2 flex-row items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 shadow-sm">
          <ClockIcon size={13} className="text-amber-600 dark:text-amber-300" />
          <Text className="font-inter text-[12px] font-bold text-neutral-600 tabular-nums dark:text-neutral-300">
            {formatTimer(elapsedSeconds)}
          </Text>
        </View>

        <Text className="text-right font-nunito text-[15px] font-extrabold text-neutral-500 tabular-nums dark:text-neutral-400">
          {currentIndex + 1}
          /
          {questions.length}
        </Text>
      </View>

      {/* 2. BODY CONTENT */}
      <ScrollView
        style={{ flex: 1 }}
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <RNAnimated.View style={{ transform: [{ translateX: slideAnim }], flex: 1 }}>

          {/* MASCOT WITH SPEECH BUBBLE */}
          <View className="mb-4 flex-row items-center justify-center gap-2">
            <Snapy pose={mascotPose} animation={mascotAnim} style={{ width: 85, height: 85 }} />
            <View className="relative max-w-[210px] rounded-2xl border-2 border-line bg-surface px-3.5 py-2.5 shadow-sm">
              <Text className="font-nunito text-[13px] font-extrabold text-mascot-navy dark:text-neutral-50">
                {bubbleText}
              </Text>
              <View className="absolute top-5 -left-2 size-3 rotate-45 border-b-2 border-l-2 border-line bg-surface" />
            </View>
          </View>

          {/* QUESTION CARD */}
          <RNAnimated.View
            style={{ transform: [{ translateX: shakeAnim }] }}
            className="mb-4 rounded-3xl border-2 border-line bg-surface p-5 shadow-sm"
          >
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <EditIcon size={16} className="text-amber-500" />
                <Text className="font-inter text-[12px] font-bold tracking-wider text-amber-600 uppercase dark:text-amber-300">
                  {translate('quiz.fill_missing_word')}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handlePlayAudio}
                accessibilityRole="button"
                accessibilityLabel={translate('quiz.listen_sentence')}
                activeOpacity={0.7}
                className={cn(
                  'size-10 items-center justify-center rounded-xl border',
                  isSpeaking ? 'border-primary-300 bg-primary-100 dark:border-primary-500/40 dark:bg-primary-500/15' : 'border-line bg-surface-raised',
                )}
              >
                <VolumeIcon size={20} className={isSpeaking ? 'text-primary-600 dark:text-primary-300' : 'text-neutral-500 dark:text-neutral-400'} />
              </TouchableOpacity>
            </View>

            {/* Prompt sentence */}
            <Text className="font-nunito text-[20px] leading-relaxed font-extrabold text-mascot-navy dark:text-neutral-50">
              {currentQ?.prompt}
            </Text>
          </RNAnimated.View>

          {/* TEXT INPUT AREA */}
          <View className="mb-4 rounded-2xl border-2 border-line bg-surface p-4 shadow-sm">
            <Text className="mb-2 font-inter text-[12px] font-bold text-neutral-400 uppercase">
              {translate('quiz.enter_word')}
            </Text>
            <TextInput
              value={inputText}
              onChangeText={(text) => {
                setInputText(text);
                setAnswerNotice(null);
              }}
              onSubmitEditing={handleCheck}
              returnKeyType="done"
              placeholder={translate('quiz.fill_placeholder')}
              placeholderTextColor="#9CA3AF"
              editable={checkState === 'IDLE' && !checkMutation.isPending && !answerLocked}
              autoCapitalize="none"
              autoCorrect={false}
              className={cn(
                'h-12 rounded-xl border-2 px-4 font-nunito text-[16px] font-bold text-mascot-navy dark:text-neutral-50',
                checkState === 'IDLE'
                  ? 'border-line bg-surface-raised focus:border-amber-500 focus:bg-white'
                  : checkState === 'CORRECT'
                    ? 'border-success-500 bg-success-50 text-success-800 dark:bg-success-500/15 dark:text-success-300'
                    : 'border-error-500 bg-error-50 text-error-800 dark:bg-error-500/15 dark:text-error-300',
              )}
            />
          </View>

        </RNAnimated.View>
      </ScrollView>

      {/* 3. STATIC BOTTOM CHECK BUTTON (IDLE) */}
      {checkState === 'IDLE' && (
        <View className="border-t border-line bg-surface p-4">
          {answerNotice && (
            <Text accessibilityLiveRegion="polite" className="mb-3 text-center font-inter text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
              {answerNotice === 'UNCONFIRMED'
                ? translate('quiz.answer_unconfirmed')
                : translate('quiz.answer_send_error')}
            </Text>
          )}
          <Pressable
            onPress={handleCheck}
            disabled={!inputText.trim() || checkMutation.isPending}
            className={cn(
              'h-13 w-full flex-row items-center justify-center gap-2 rounded-2xl border-b-4',
              inputText.trim() && !checkMutation.isPending
                ? 'border-amber-700 bg-amber-500 active:translate-y-px active:border-b-2'
                : 'border-edge bg-muted',
            )}
          >
            {checkMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text
                  className={cn(
                    'font-nunito text-[16px] font-extrabold uppercase',
                    inputText.trim() ? 'text-amber-950' : 'text-neutral-400',
                  )}
                >
                  {answerLocked ? translate('quiz.resend') : translate('quiz.check')}
                </Text>
                <ArrowRightIcon
                  size={18}
                  className={inputText.trim() ? 'text-amber-950' : 'text-neutral-400'}
                />
              </>
            )}
          </Pressable>
        </View>
      )}

      {/* 4. SLIDE-UP FEEDBACK DRAWER (SUBMITTED) */}
      {checkState !== 'IDLE' && (
        <RNAnimated.View
          style={{ transform: [{ translateY }] }}
          className={cn(
            'border-t-2 p-5',
            checkState === 'CORRECT' ? 'border-success-500 bg-success-50 dark:bg-success-500/15' : 'border-error-500 bg-error-50 dark:bg-error-500/15',
          )}
        >
          <View className="mb-4 flex-row items-center gap-3">
            <View
              className={cn(
                'size-10 items-center justify-center rounded-full',
                checkState === 'CORRECT' ? 'bg-success-500' : 'bg-error-500',
              )}
            >
              {checkState === 'CORRECT' ? (
                <CheckCircleIcon size={24} color="#FFFFFF" />
              ) : (
                <XCircleIcon size={24} color="#FFFFFF" />
              )}
            </View>

            <View className="flex-1">
              <Text
                className={cn(
                  'font-nunito text-[18px] font-extrabold',
                  checkState === 'CORRECT' ? 'text-success-800 dark:text-success-300' : 'text-error-800 dark:text-error-300',
                )}
              >
                {checkState === 'CORRECT' ? translate('quiz.correct_celebration') : translate('quiz.incorrect_encouragement')}
              </Text>
              {checkState === 'INCORRECT' && correctAnswerText && (
                <Text className="mt-0.5 font-inter text-[13px] font-medium text-error-700 dark:text-error-300">
                  {translate('quiz.correct_answer')}
                  {' '}
                  <Text className="font-bold text-error-900 dark:text-error-300">{correctAnswerText}</Text>
                </Text>
              )}
            </View>
          </View>

          <Pressable
            onPress={handleNext}
            disabled={finishQuiz.isPending}
            className={cn(
              'h-13 w-full flex-row items-center justify-center gap-2 rounded-2xl border-b-4 active:translate-y-px active:border-b-2',
              checkState === 'CORRECT'
                ? 'border-success-700 bg-success-500'
                : 'border-error-700 bg-error-500',
              finishQuiz.isPending && 'opacity-70',
            )}
          >
            {finishQuiz.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text className="font-nunito text-[16px] font-extrabold text-white uppercase">
                  {nextIndex === -1 ? translate('quiz.completed') : translate('quiz.continue')}
                </Text>
                <ArrowRightIcon size={18} color="#FFFFFF" />
              </>
            )}
          </Pressable>
        </RNAnimated.View>
      )}

      {/* 5. EXIT CONFIRMATION MODAL */}
      <QuizExitModal
        visible={showExitModal}
        quizId={quiz.quizId}
        onClose={() => setShowExitModal(false)}
        onExited={onExit}
      />

    </SafeAreaView>
  );
}

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
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRightIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  CloseIcon,
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

type CheckState = 'IDLE' | 'CORRECT' | 'INCORRECT';

export type MultipleChoiceQuizViewProps = {
  quiz: QuizPlayDTO;
  onExit: () => void;
  /** Reload the session from the server when it moved on (graded elsewhere, terminal). */
  onResync: () => void;
};

export function MultipleChoiceQuizView({ quiz, onExit, onResync }: MultipleChoiceQuizViewProps) {
  const questions = quiz.questions || [];

  // Resume at the first question the server has not graded (D18); the Session screen handles "all graded".
  const [currentIndex, setCurrentIndex] = useState(() => Math.max(0, firstUnresolvedIndex(questions)));
  const [selectedOptKey, setSelectedOptKey] = useState<string | null>(null);
  const [checkState, setCheckState] = useState<CheckState>('IDLE');
  const [correctAnswerText, setCorrectAnswerText] = useState<string>('');
  const [correctOptionKey, setCorrectOptionKey] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => generateIdempotencyKey());
  // UNCONFIRMED: the check may have been committed, so the answer stays locked until the same
  // request (same key + same option) is confirmed. REJECTED: nothing was written, pick again.
  const [answerNotice, setAnswerNotice] = useState<'UNCONFIRMED' | 'REJECTED' | null>(null);
  const answerLocked = answerNotice === 'UNCONFIRMED';
  const advancingRef = useRef(false);

  const [mascotPose, setMascotPose] = useState<SnapyPose>('tap_trung');
  const [mascotAnim, setMascotAnim] = useState<string>('idle');
  const { speak, isPlaying: isSpeaking } = useTts();
  const [showExitModal, setShowExitModal] = useState(false);

  // Live Stopwatch State
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Animations
  const bottomBarAnim = useRef(new RNAnimated.Value(0)).current;
  const slideAnim = useRef(new RNAnimated.Value(0)).current;
  const { width } = Dimensions.get('window');

  // Entrance Choreography Animations
  const mascotTranslateY = useRef(new RNAnimated.Value(150)).current;
  const mascotScaleX = useRef(new RNAnimated.Value(1)).current;
  const mascotScaleY = useRef(new RNAnimated.Value(1)).current;
  const contentOpacity = useRef(new RNAnimated.Value(0)).current;
  const contentTranslateY = useRef(new RNAnimated.Value(15)).current;
  const optionsAnims = useRef([
    new RNAnimated.Value(0),
    new RNAnimated.Value(0),
    new RNAnimated.Value(0),
    new RNAnimated.Value(0),
  ]).current;

  useEffect(() => {
    // Entrance Sequence
    const delay = RNAnimated.delay(300);

    const squash = RNAnimated.parallel([
      RNAnimated.timing(mascotScaleX, { toValue: 1.2, duration: 120, useNativeDriver: true }),
      RNAnimated.timing(mascotScaleY, { toValue: 0.8, duration: 120, useNativeDriver: true }),
    ]);

    const jump = RNAnimated.parallel([
      RNAnimated.timing(mascotTranslateY, { toValue: 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      RNAnimated.timing(mascotScaleX, { toValue: 0.9, duration: 180, useNativeDriver: true }),
      RNAnimated.timing(mascotScaleY, { toValue: 1.1, duration: 180, useNativeDriver: true }),
    ]);

    const settle = RNAnimated.parallel([
      RNAnimated.spring(mascotScaleX, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
      RNAnimated.spring(mascotScaleY, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
    ]);

    const revealQuestion = RNAnimated.parallel([
      RNAnimated.timing(contentOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      RNAnimated.timing(contentTranslateY, { toValue: 0, duration: 250, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]);

    const revealOptions = RNAnimated.stagger(60, optionsAnims.map(anim =>
      RNAnimated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ));

    RNAnimated.sequence([
      delay,
      squash,
      jump,
      settle,
      RNAnimated.parallel([revealQuestion, revealOptions]),
    ]).start();
  }, [contentOpacity, contentTranslateY, mascotScaleX, mascotScaleY, mascotTranslateY, optionsAnims]);

  const currentQ = questions[currentIndex] || questions[0];
  const progressPercent = questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;

  const nextIndex = firstUnresolvedIndex(questions, currentIndex);

  const checkMutation = useCheckQuestion();
  const finishQuiz = useFinishQuiz(quiz.quizId, onResync);
  const handleExpiredSession = useExpiredSessionHandler();

  const handleCheck = () => {
    if (!selectedOptKey || checkState !== 'IDLE' || checkMutation.isPending || !currentQ)
      return;

    checkMutation.mutate(
      {
        questionId: currentQ.questionId,
        data: { optionKey: selectedOptKey },
        idempotencyKey,
      },
      {
        onSuccess: (data) => {
          const isCorrect = data.correct;
          setAnswerNotice(null);
          setCheckState(isCorrect ? 'CORRECT' : 'INCORRECT');
          setCorrectAnswerText(data.correctAnswer);
          setCorrectOptionKey(data.correctOptionKey || null);
          setMascotPose(isCorrect ? 'nhay_len' : 'bat_ngo');
          setMascotAnim(isCorrect ? 'celebrate' : 'shake');

          // Mascot reaction bounce
          RNAnimated.sequence([
            RNAnimated.timing(mascotScaleY, { toValue: 0.88, duration: 90, useNativeDriver: true }),
            RNAnimated.spring(mascotScaleY, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }),
          ]).start();

          // Spring bottom bar
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
            setAnswerNotice('UNCONFIRMED'); // same key + same locked option on retry
          }
        },
      },
    );
  };

  const handleNext = () => {
    // A second tap during the slide would advance twice and skip a question.
    if (advancingRef.current)
      return;
    if (nextIndex === -1) {
      finishQuiz.finish();
      return;
    }
    advancingRef.current = true;

    // Slide out current question
    RNAnimated.timing(slideAnim, {
      toValue: -width,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setCurrentIndex(nextIndex);
      advancingRef.current = false;
      setSelectedOptKey(null);
      setCheckState('IDLE');
      setCorrectAnswerText('');
      setCorrectOptionKey(null);
      setIdempotencyKey(generateIdempotencyKey()); // New key for next question
      setMascotPose('tap_trung');
      setMascotAnim('idle');
      bottomBarAnim.setValue(0);

      // Slide in new question
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
    outputRange: [120, 0],
  });

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background" edges={['top', 'bottom']}>

      {/* 1. TOP PROGRESS BAR & LIVE STOPWATCH */}
      <RNAnimated.View style={{ opacity: contentOpacity }}>
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
                className="h-full rounded-full bg-primary-500"
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
            <ClockIcon size={13} className="text-primary-600 dark:text-primary-300" />
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
      </RNAnimated.View>

      {/* 2. QUESTION & OPTIONS AREA */}
      <ScrollView
        style={{ flex: 1 }}
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <RNAnimated.View style={{ transform: [{ translateX: slideAnim }], flex: 1 }}>

          {/* MASCOT CHOREOGRAPHY */}
          <RNAnimated.View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              marginVertical: 6,
              zIndex: 10,
              transform: [
                { translateY: mascotTranslateY },
                { scaleX: mascotScaleX },
                { scaleY: mascotScaleY },
              ],
            }}
          >
            <View style={{ width: 105, height: 105, alignItems: 'center', justifyContent: 'center' }}>
              <Snapy pose={mascotPose} animation={mascotAnim} style={{ width: 105, height: 105 }} />
            </View>
          </RNAnimated.View>

          {/* QUESTION TEXT */}
          <RNAnimated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] }}>
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="font-inter text-[13px] font-bold tracking-wide text-neutral-400 uppercase">
                {quiz.direction === 'VI_EN' ? translate('quiz.choose_english_word') : translate('quiz.choose_vietnamese_meaning')}
              </Text>
              <View className="rounded-md bg-muted px-2 py-0.5">
                <Text className="font-inter text-[10px] font-bold text-neutral-500 dark:text-neutral-400">
                  {quiz.direction === 'VI_EN' ? '🇻🇳 ➔ 🇬🇧' : '🇬🇧 ➔ 🇻🇳'}
                </Text>
              </View>
            </View>

            <View className="mb-1.5 flex-row items-center justify-between rounded-2xl border-2 border-line bg-surface p-4">
              <View className="flex-1 pr-2">
                <Text className="font-nunito text-[28px] leading-tight font-extrabold text-mascot-navy dark:text-neutral-50">
                  {currentQ?.prompt}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => speak(currentQ?.prompt || '', { lang: quiz.direction === 'VI_EN' ? 'vi' : 'en' })}
                accessibilityRole="button"
                accessibilityLabel={translate('quiz.listen_pronunciation')}
                activeOpacity={0.7}
                className={cn(
                  'size-12 items-center justify-center rounded-2xl border',
                  isSpeaking
                    ? 'scale-105 border-primary-300 bg-primary-100 dark:border-primary-500/40 dark:bg-primary-500/15'
                    : 'border-info-200 bg-info-50 dark:border-info-500/40 dark:bg-info-500/15',
                )}
              >
                <VolumeIcon size={24} className={isSpeaking ? 'text-primary-600 dark:text-primary-300' : 'text-info-500'} />
              </TouchableOpacity>
            </View>
          </RNAnimated.View>

          {/* 3. ANSWER OPTIONS */}
          <View className="mt-4 gap-3">
            {currentQ?.options?.map((opt, idx) => {
              const isSelected = selectedOptKey === opt.key;
              const isSubmitted = checkState !== 'IDLE';
              const isCorrectOption = opt.key === correctOptionKey;

              let containerStyle = 'bg-surface border-line border-b-[4px]';
              let textStyle = 'text-mascot-navy dark:text-neutral-50';

              if (isSubmitted) {
                containerStyle = 'bg-surface border-line border-b-[3px] opacity-40';
                if (isSelected && checkState === 'CORRECT') {
                  containerStyle = 'bg-success-50 dark:bg-success-500/15 border-success-500 border-b-[4px] opacity-100';
                  textStyle = 'text-success-800 dark:text-success-300';
                }
                else if (isSelected && checkState === 'INCORRECT') {
                  containerStyle = 'bg-error-50 dark:bg-error-500/15 border-error-500 border-b-[4px] opacity-100';
                  textStyle = 'text-error-800 dark:text-error-300';
                }
                else if (isCorrectOption && checkState === 'INCORRECT') {
                  containerStyle = 'bg-success-50 dark:bg-success-500/15 border-success-500 border-b-[4px] opacity-100';
                  textStyle = 'text-success-800 dark:text-success-300';
                }
              }
              else if (isSelected) {
                containerStyle = 'bg-primary-50 dark:bg-primary-500/15 border-primary-500 border-b-[4px]';
                textStyle = 'text-primary-800 dark:text-primary-300';
              }

              const animVal = optionsAnims[idx] || new RNAnimated.Value(1);

              return (
                <RNAnimated.View
                  key={opt.key}
                  style={{
                    opacity: animVal,
                    transform: [{
                      translateY: animVal.interpolate({ inputRange: [0, 1], outputRange: [15, 0] }),
                    }],
                  }}
                >
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedOptKey(opt.key);
                      setAnswerNotice(null);
                    }}
                    disabled={isSubmitted || checkMutation.isPending || answerLocked}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected, disabled: isSubmitted || answerLocked }}
                    activeOpacity={0.85}
                    className={cn('flex-row items-center rounded-2xl border-2 p-4', containerStyle)}
                  >
                    <View
                      className={cn(
                        'mr-3 size-7 items-center justify-center rounded-lg border-2',
                        isSelected && !isSubmitted
                          ? 'border-primary-500 bg-primary-500'
                          : isSubmitted && isSelected && checkState === 'CORRECT'
                            ? 'border-success-500 bg-success-500'
                            : isSubmitted && isSelected && checkState === 'INCORRECT'
                              ? 'border-error-500 bg-error-500'
                              : isSubmitted && isCorrectOption
                                ? 'border-success-500 bg-success-500'
                                : 'border-line bg-surface-raised',
                      )}
                    >
                      {isSelected && !isSubmitted && (
                        <CheckIcon size={14} className="text-white" />
                      )}
                      {isSubmitted && isSelected && checkState === 'CORRECT' && (
                        <CheckCircleIcon size={16} className="text-white" />
                      )}
                      {isSubmitted && isSelected && checkState === 'INCORRECT' && (
                        <XCircleIcon size={16} className="text-white" />
                      )}
                      {isSubmitted && !isSelected && isCorrectOption && checkState === 'INCORRECT' && (
                        <CheckCircleIcon size={16} className="text-white" />
                      )}
                      {!isSelected && !isSubmitted && (
                        <Text className="text-[12px] font-bold text-neutral-400">
                          {String.fromCharCode(65 + idx)}
                        </Text>
                      )}
                    </View>

                    <Text className={cn('flex-1 font-inter text-[15px] font-bold', textStyle)}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                </RNAnimated.View>
              );
            })}
          </View>

        </RNAnimated.View>
      </ScrollView>

      {/* 4. STATIC CHECK BUTTON (IDLE) */}
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
            disabled={!selectedOptKey || checkMutation.isPending}
            className={cn(
              'h-13 w-full flex-row items-center justify-center gap-2 rounded-2xl border-b-4',
              selectedOptKey && !checkMutation.isPending
                ? 'border-brand-edge bg-brand active:translate-y-px active:border-b-2'
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
                    selectedOptKey ? 'text-on-brand' : 'text-neutral-400',
                  )}
                >
                  {answerLocked ? translate('quiz.resend') : translate('quiz.check')}
                </Text>
                <ArrowRightIcon
                  size={18}
                  className={selectedOptKey ? 'text-on-brand' : 'text-neutral-400'}
                />
              </>
            )}
          </Pressable>
        </View>
      )}

      {/* 5. SLIDE-UP FEEDBACK BOTTOM BAR (SUBMITTED) */}
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
                <CheckCircleIcon size={24} className="text-white" />
              ) : (
                <XCircleIcon size={24} className="text-white" />
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
                <ArrowRightIcon size={18} className="text-white" />
              </>
            )}
          </Pressable>
        </RNAnimated.View>
      )}

      {/* 6. EXIT CONFIRMATION MODAL */}
      <QuizExitModal
        visible={showExitModal}
        quizId={quiz.quizId}
        onClose={() => setShowExitModal(false)}
        onExited={onExit}
      />

    </SafeAreaView>
  );
}

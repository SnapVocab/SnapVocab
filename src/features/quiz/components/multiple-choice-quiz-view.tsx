/* eslint-disable max-lines-per-function */
import type { QuizPlayDTO } from '../types';
import type { SnapyPose } from '@/components/ui/snapy';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Easing,
  Modal,
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
  LogOutIcon,
  VolumeIcon,
  XCircleIcon,
} from '@/components/ui/icons';
import { Snapy } from '@/components/ui/snapy';
import { cn } from '@/lib/utils';
import { useCancelQuiz, useCheckQuestion, useCompleteQuiz } from '../api/quiz-api';
import { useExpiredSessionHandler } from '../hooks/use-expired-session-handler';
import { generateIdempotencyKey } from '../utils/idempotency';

type CheckState = 'IDLE' | 'CORRECT' | 'INCORRECT';

export type MultipleChoiceQuizViewProps = {
  quiz: QuizPlayDTO;
  onExit: () => void;
};

export function MultipleChoiceQuizView({ quiz, onExit }: MultipleChoiceQuizViewProps) {
  const router = useRouter();
  const questions = quiz.questions || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptKey, setSelectedOptKey] = useState<string | null>(null);
  const [checkState, setCheckState] = useState<CheckState>('IDLE');
  const [correctAnswerText, setCorrectAnswerText] = useState<string>('');
  const [correctOptionKey, setCorrectOptionKey] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => generateIdempotencyKey());

  const [mascotPose, setMascotPose] = useState<SnapyPose>('tap_trung');
  const [mascotAnim, setMascotAnim] = useState<string>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
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

  // Web Speech API Pronunciation
  const playPronunciation = (word: string) => {
    setIsSpeaking(true);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
    else {
      setTimeout(() => setIsSpeaking(false), 800);
    }
  };

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

  const checkMutation = useCheckQuestion();
  const completeMutation = useCompleteQuiz();
  const cancelMutation = useCancelQuiz();
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
          handleExpiredSession(error);
          // Keep idempotencyKey so re-tap retries with same key
        },
      },
    );
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      if (completeMutation.isPending)
        return;
      completeMutation.mutate(quiz.quizId, {
        onSuccess: () => {
          router.replace({
            pathname: '/(app)/study/quiz-result' as any,
            params: { quizId: String(quiz.quizId) },
          });
        },
        onError: (error) => {
          if (handleExpiredSession(error))
            return;
          // On complete error, still attempt to navigate to result
          router.replace({
            pathname: '/(app)/study/quiz-result' as any,
            params: { quizId: String(quiz.quizId) },
          });
        },
      });
      return;
    }

    // Slide out current question
    RNAnimated.timing(slideAnim, {
      toValue: -width,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setCurrentIndex(prev => prev + 1);
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

  const handleExitConfirm = () => {
    setShowExitModal(false);
    cancelMutation.mutate({ quizId: quiz.quizId });
    onExit();
  };

  const translateY = bottomBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [120, 0],
  });

  return (
    <SafeAreaView className="flex-1 bg-[#F7F8FA]" edges={['top', 'bottom']}>

      {/* 1. TOP PROGRESS BAR & LIVE STOPWATCH */}
      <RNAnimated.View style={{ opacity: contentOpacity }}>
        <View className="z-10 flex-row items-center justify-between border-b border-neutral-100 bg-[#F7F8FA] px-4 py-3">
          <TouchableOpacity
            onPress={() => setShowExitModal(true)}
            activeOpacity={0.7}
            className="-ml-2 size-10 items-center justify-center rounded-full"
          >
            <CloseIcon size={24} className="text-neutral-500" />
          </TouchableOpacity>

          <View className="mx-3 flex-1">
            <View className="h-3 w-full overflow-hidden rounded-full bg-neutral-200">
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
          <View className="mr-2 flex-row items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-2.5 py-1 shadow-sm">
            <ClockIcon size={13} className="text-primary-600" />
            <Text className="font-inter text-[12px] font-bold text-neutral-600 tabular-nums">
              {formatTimer(elapsedSeconds)}
            </Text>
          </View>

          <Text className="text-right font-nunito text-[15px] font-extrabold text-neutral-500 tabular-nums">
            {currentIndex + 1}
            /
            {questions.length}
          </Text>
        </View>
      </RNAnimated.View>

      {/* 2. QUESTION & OPTIONS AREA */}
      <ScrollView
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
                {quiz.direction === 'VI_EN' ? 'Chọn từ tiếng Anh phù hợp' : 'Chọn nghĩa tiếng Việt đúng'}
              </Text>
              <View className="rounded-md bg-neutral-100 px-2 py-0.5">
                <Text className="font-inter text-[10px] font-bold text-neutral-500">
                  {quiz.direction === 'VI_EN' ? '🇻🇳 ➔ 🇬🇧' : '🇬🇧 ➔ 🇻🇳'}
                </Text>
              </View>
            </View>

            <View className="mb-1.5 flex-row items-center justify-between rounded-2xl border-2 border-neutral-100 bg-white p-4">
              <View className="flex-1 pr-2">
                <Text className="font-nunito text-[28px] leading-tight font-extrabold text-mascot-navy">
                  {currentQ?.prompt}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => playPronunciation(currentQ?.prompt || '')}
                activeOpacity={0.7}
                className={cn(
                  'size-12 items-center justify-center rounded-2xl border',
                  isSpeaking
                    ? 'scale-105 border-primary-300 bg-primary-100'
                    : 'border-info-200 bg-info-50',
                )}
              >
                <VolumeIcon size={24} className={isSpeaking ? 'text-primary-600' : 'text-info-500'} />
              </TouchableOpacity>
            </View>
          </RNAnimated.View>

          {/* 3. ANSWER OPTIONS */}
          <View className="mt-4 gap-3">
            {currentQ?.options?.map((opt, idx) => {
              const isSelected = selectedOptKey === opt.key;
              const isSubmitted = checkState !== 'IDLE';
              const isCorrectOption = opt.key === correctOptionKey;

              let containerStyle = 'bg-white border-neutral-200 border-b-[4px]';
              let textStyle = 'text-mascot-navy';

              if (isSubmitted) {
                containerStyle = 'bg-white border-neutral-200 border-b-[3px] opacity-40';
                if (isSelected && checkState === 'CORRECT') {
                  containerStyle = 'bg-success-50 border-success-500 border-b-[4px] opacity-100';
                  textStyle = 'text-success-800';
                }
                else if (isSelected && checkState === 'INCORRECT') {
                  containerStyle = 'bg-error-50 border-error-500 border-b-[4px] opacity-100';
                  textStyle = 'text-error-800';
                }
                else if (isCorrectOption && checkState === 'INCORRECT') {
                  containerStyle = 'bg-success-50 border-success-500 border-b-[4px] opacity-100';
                  textStyle = 'text-success-800';
                }
              }
              else if (isSelected) {
                containerStyle = 'bg-primary-50 border-primary-500 border-b-[4px]';
                textStyle = 'text-primary-800';
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
                    onPress={() => !isSubmitted && setSelectedOptKey(opt.key)}
                    disabled={isSubmitted || checkMutation.isPending}
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
                                : 'border-neutral-200 bg-neutral-50',
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
        <View className="border-t border-neutral-100 bg-white p-4">
          <Pressable
            onPress={handleCheck}
            disabled={!selectedOptKey || checkMutation.isPending}
            className={cn(
              'h-13 w-full flex-row items-center justify-center gap-2 rounded-2xl border-b-4',
              selectedOptKey && !checkMutation.isPending
                ? 'border-primary-700 bg-primary-500 active:translate-y-px active:border-b-2'
                : 'border-neutral-200 bg-neutral-200',
            )}
          >
            {checkMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text
                  className={cn(
                    'font-nunito text-[16px] font-extrabold uppercase',
                    selectedOptKey ? 'text-white' : 'text-neutral-400',
                  )}
                >
                  Kiểm tra
                </Text>
                <ArrowRightIcon
                  size={18}
                  className={selectedOptKey ? 'text-white' : 'text-neutral-400'}
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
            checkState === 'CORRECT' ? 'border-success-500 bg-success-50' : 'border-error-500 bg-error-50',
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
                  checkState === 'CORRECT' ? 'text-success-800' : 'text-error-800',
                )}
              >
                {checkState === 'CORRECT' ? 'Chính xác! Tuyệt vời lắm! 🎉' : 'Chưa chính xác rồi! 🤔'}
              </Text>

              {checkState === 'INCORRECT' && correctAnswerText && (
                <Text className="mt-0.5 font-inter text-[13px] font-medium text-error-700">
                  Đáp án đúng:
                  {' '}
                  <Text className="font-bold text-error-900">{correctAnswerText}</Text>
                </Text>
              )}
            </View>
          </View>

          <Pressable
            onPress={handleNext}
            disabled={completeMutation.isPending}
            className={cn(
              'h-13 w-full flex-row items-center justify-center gap-2 rounded-2xl border-b-4 active:translate-y-px active:border-b-2',
              checkState === 'CORRECT'
                ? 'border-success-700 bg-success-500'
                : 'border-error-700 bg-error-500',
              completeMutation.isPending && 'opacity-70',
            )}
          >
            {completeMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text className="font-nunito text-[16px] font-extrabold text-white uppercase">
                  {currentIndex + 1 >= questions.length ? 'Hoàn thành' : 'Tiếp tục'}
                </Text>
                <ArrowRightIcon size={18} className="text-white" />
              </>
            )}
          </Pressable>
        </RNAnimated.View>
      )}

      {/* 6. EXIT CONFIRMATION MODAL */}
      <Modal visible={showExitModal} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/50 p-6">
          <View className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
            <View className="mb-4 size-14 items-center justify-center self-center rounded-2xl bg-amber-50">
              <LogOutIcon size={28} className="text-amber-500" />
            </View>

            <Text className="mb-2 text-center font-nunito text-[20px] font-extrabold text-mascot-navy">
              Dừng làm bài Quiz?
            </Text>
            <Text className="mb-6 text-center font-inter text-[14px] leading-relaxed text-neutral-500">
              Tiến trình làm bài này sẽ bị hủy. Bạn có muốn thoát không?
            </Text>

            <View className="gap-2.5">
              <Pressable
                onPress={() => setShowExitModal(false)}
                className="h-12 w-full items-center justify-center rounded-xl border-b-2 border-primary-700 bg-primary-500 active:bg-primary-600"
              >
                <Text className="font-nunito text-[15px] font-extrabold text-white">Tiếp tục làm bài</Text>
              </Pressable>

              <Pressable
                onPress={handleExitConfirm}
                className="h-12 w-full items-center justify-center rounded-xl bg-neutral-100 active:bg-neutral-200"
              >
                <Text className="font-nunito text-[15px] font-extrabold text-neutral-600">Thoát</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

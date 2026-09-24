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
  LogOutIcon,
  VolumeIcon,
  XCircleIcon,
} from '@/components/ui/icons';
import { Snapy } from '@/components/ui/snapy';
import { cn } from '@/lib/utils';
import { useCancelQuiz, useCheckQuestion, useCompleteQuiz } from '../api/quiz-api';
import { useExpiredSessionHandler } from '../hooks/use-expired-session-handler';
import { generateIdempotencyKey } from '../utils/idempotency';

// Web Speech API Pronunciation
function speakSentence(text: string) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }
}

export type FillBlankQuizViewProps = {
  quiz: QuizPlayDTO;
  onExit: () => void;
};

export function FillBlankQuizView({ quiz, onExit }: FillBlankQuizViewProps) {
  const router = useRouter();
  const { width } = Dimensions.get('window');
  const questions = quiz.questions || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputText, setInputText] = useState('');
  const [checkState, setCheckState] = useState<'IDLE' | 'CORRECT' | 'INCORRECT'>('IDLE');
  const [correctAnswerText, setCorrectAnswerText] = useState<string>('');
  const [showExitModal, setShowExitModal] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => generateIdempotencyKey());

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
  const [bubbleText, setBubbleText] = useState('Gõ từ thích hợp vào chỗ trống!');

  // Animation references
  const slideAnim = useRef(new RNAnimated.Value(0)).current;
  const shakeAnim = useRef(new RNAnimated.Value(0)).current;
  const bottomBarAnim = useRef(new RNAnimated.Value(0)).current;

  const currentQ = questions[currentIndex] || questions[0];
  const progressPercent = questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;

  const checkMutation = useCheckQuestion();
  const completeMutation = useCompleteQuiz();
  const cancelMutation = useCancelQuiz();
  const handleExpiredSession = useExpiredSessionHandler();

  // Play sentence audio
  const handlePlayAudio = () => {
    if (!currentQ?.prompt)
      return;
    setIsSpeaking(true);
    speakSentence(currentQ.prompt.replace(/_____/g, 'blank'));
    setTimeout(() => setIsSpeaking(false), 2000);
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
          setCheckState(isCorrect ? 'CORRECT' : 'INCORRECT');
          setCorrectAnswerText(data.correctAnswer);

          if (isCorrect) {
            setMascotPose('an_mung');
            setMascotAnim('celebrate');
            setBubbleText('Xuất sắc! Bạn đã điền chính xác! 🎉');
            if (data.correctAnswer) {
              speakSentence(currentQ.prompt.replace(/_____/g, data.correctAnswer));
            }
          }
          else {
            setMascotPose('bat_ngo');
            setMascotAnim('shake');
            setBubbleText('Chưa chính xác rồi! Cùng xem đáp án nhé! 🤔');

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
          handleExpiredSession(error);
          // Keep idempotencyKey so retry sends same key
        },
      },
    );
  };

  // Advance to next question or complete
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
          router.replace({
            pathname: '/(app)/study/quiz-result' as any,
            params: { quizId: String(quiz.quizId) },
          });
        },
      });
      return;
    }

    // Slide out
    RNAnimated.timing(slideAnim, {
      toValue: -width,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setCurrentIndex(prev => prev + 1);
      setInputText('');
      setCheckState('IDLE');
      setCorrectAnswerText('');
      setIdempotencyKey(generateIdempotencyKey());
      setMascotPose('tap_trung');
      setMascotAnim('idle');
      setBubbleText('Gõ từ thích hợp vào chỗ trống!');
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

  const handleExitConfirm = () => {
    setShowExitModal(false);
    cancelMutation.mutate({ quizId: quiz.quizId });
    onExit();
  };

  const translateY = bottomBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [140, 0],
  });

  return (
    <SafeAreaView className="flex-1 bg-[#F7F8FA]" edges={['top', 'bottom']}>

      {/* 1. TOP BAR */}
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
        <View className="mr-2 flex-row items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-2.5 py-1 shadow-sm">
          <ClockIcon size={13} className="text-amber-600" />
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

      {/* 2. BODY CONTENT */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <RNAnimated.View style={{ transform: [{ translateX: slideAnim }], flex: 1 }}>

          {/* MASCOT WITH SPEECH BUBBLE */}
          <View className="mb-4 flex-row items-center justify-center gap-2">
            <Snapy pose={mascotPose} animation={mascotAnim} style={{ width: 85, height: 85 }} />
            <View className="relative max-w-[210px] rounded-2xl border-2 border-neutral-200 bg-white px-3.5 py-2.5 shadow-sm">
              <Text className="font-nunito text-[13px] font-extrabold text-mascot-navy">
                {bubbleText}
              </Text>
              <View className="absolute top-5 -left-2 size-3 rotate-45 border-b-2 border-l-2 border-neutral-200 bg-white" />
            </View>
          </View>

          {/* QUESTION CARD */}
          <RNAnimated.View
            style={{ transform: [{ translateX: shakeAnim }] }}
            className="mb-4 rounded-3xl border-2 border-neutral-200 bg-white p-5 shadow-sm"
          >
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <EditIcon size={16} className="text-amber-500" />
                <Text className="font-inter text-[12px] font-bold tracking-wider text-amber-600 uppercase">
                  Điền từ còn thiếu
                </Text>
              </View>

              <TouchableOpacity
                onPress={handlePlayAudio}
                activeOpacity={0.7}
                className={cn(
                  'size-10 items-center justify-center rounded-xl border',
                  isSpeaking ? 'border-primary-300 bg-primary-100' : 'border-neutral-200 bg-neutral-50',
                )}
              >
                <VolumeIcon size={20} className={isSpeaking ? 'text-primary-600' : 'text-neutral-500'} />
              </TouchableOpacity>
            </View>

            {/* Prompt sentence */}
            <Text className="font-nunito text-[20px] leading-relaxed font-extrabold text-mascot-navy">
              {currentQ?.prompt}
            </Text>
          </RNAnimated.View>

          {/* TEXT INPUT AREA */}
          <View className="mb-4 rounded-2xl border-2 border-neutral-200 bg-white p-4 shadow-sm">
            <Text className="mb-2 font-inter text-[12px] font-bold text-neutral-400 uppercase">
              Nhập từ vựng của bạn:
            </Text>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Gõ từ vựng tại đây..."
              placeholderTextColor="#9CA3AF"
              editable={checkState === 'IDLE' && !checkMutation.isPending}
              autoCapitalize="none"
              autoCorrect={false}
              className={cn(
                'h-12 rounded-xl border-2 px-4 font-nunito text-[16px] font-bold text-mascot-navy',
                checkState === 'IDLE'
                  ? 'border-neutral-200 bg-neutral-50 focus:border-amber-500 focus:bg-white'
                  : checkState === 'CORRECT'
                    ? 'border-success-500 bg-success-50 text-success-800'
                    : 'border-error-500 bg-error-50 text-error-800',
              )}
            />
          </View>

        </RNAnimated.View>
      </ScrollView>

      {/* 3. STATIC BOTTOM CHECK BUTTON (IDLE) */}
      {checkState === 'IDLE' && (
        <View className="border-t border-neutral-100 bg-white p-4">
          <Pressable
            onPress={handleCheck}
            disabled={!inputText.trim() || checkMutation.isPending}
            className={cn(
              'h-13 w-full flex-row items-center justify-center gap-2 rounded-2xl border-b-4',
              inputText.trim() && !checkMutation.isPending
                ? 'border-amber-700 bg-amber-500 active:translate-y-px active:border-b-2'
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
                    inputText.trim() ? 'text-white' : 'text-neutral-400',
                  )}
                >
                  Kiểm tra
                </Text>
                <ArrowRightIcon
                  size={18}
                  className={inputText.trim() ? 'text-white' : 'text-neutral-400'}
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
                {checkState === 'CORRECT' ? 'Chính xác! Tuyệt vời! 🎉' : 'Chưa chính xác rồi! 🤔'}
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

      {/* 5. EXIT CONFIRMATION MODAL */}
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

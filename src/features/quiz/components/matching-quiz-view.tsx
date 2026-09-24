/* eslint-disable max-lines-per-function */
import type { QuizPlayDTO } from '../types';
import type { SnapyPose } from '@/components/ui/snapy';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
  ClockIcon,
  CloseIcon,
  LogOutIcon,
} from '@/components/ui/icons';
import { Snapy } from '@/components/ui/snapy';
import { cn } from '@/lib/utils';
import { useAttemptMatchingPair, useCancelQuiz, useCompleteQuiz } from '../api/quiz-api';
import { useExpiredSessionHandler } from '../hooks/use-expired-session-handler';
import { generateIdempotencyKey } from '../utils/idempotency';

// Web Audio Chimes
function playSuccessChime() {
  if (typeof window === 'undefined')
    return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass)
      return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    osc1.frequency.setValueAtTime(659.25, now + 0.08);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);
  }
  catch {
    // Ignore audio context issues
  }
}

function playErrorBuzz() {
  if (typeof window === 'undefined')
    return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass)
      return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.2);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.28);
  }
  catch {
    // Ignore
  }
}

function pronounceWord(word: string) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = 0.88;
    window.speechSynthesis.speak(utterance);
  }
}

export type MatchingQuizViewProps = {
  quiz: QuizPlayDTO;
  onExit: () => void;
};

export function MatchingQuizView({ quiz, onExit }: MatchingQuizViewProps) {
  const router = useRouter();
  const matchingRounds = quiz.matchingRounds || [];

  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const activeRound = matchingRounds[currentRoundIndex] || matchingRounds[0];

  // Selection state
  const [selectedLeftKey, setSelectedLeftKey] = useState<string | null>(null);
  const [selectedRightKey, setSelectedRightKey] = useState<string | null>(null);

  // Matched tiles sets
  const [matchedLeftKeys, setMatchedLeftKeys] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    activeRound?.leftTiles?.forEach((t) => {
      if (t.resolved)
        initial.add(t.key);
    });
    return initial;
  });

  const [matchedRightKeys, setMatchedRightKeys] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    activeRound?.rightTiles?.forEach((t) => {
      if (t.matched)
        initial.add(t.key);
    });
    return initial;
  });

  const [failedKeys, setFailedKeys] = useState<Set<string>>(new Set());

  // Idempotency key for current pending attempt
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => generateIdempotencyKey());

  // Mascot and modal state
  const [mascotPose, setMascotPose] = useState<SnapyPose>('tap_trung');
  const [mascotAnim, setMascotAnim] = useState<string>('idle');
  const [bubbleText, setBubbleText] = useState<string>('Chạm vào từ tiếng Anh & nghĩa tiếng Việt!');
  const [showExitModal, setShowExitModal] = useState(false);

  // Live Stopwatch
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

  const contentFade = useRef(new RNAnimated.Value(1)).current;

  // React Query mutations
  const attemptMutation = useAttemptMatchingPair();
  const completeMutation = useCompleteQuiz();
  const cancelMutation = useCancelQuiz();
  const handleExpiredSession = useExpiredSessionHandler();

  // Reset tiles when round changes
  useEffect(() => {
    setSelectedLeftKey(null);
    setSelectedRightKey(null);
    setFailedKeys(new Set());

    const newLeft = new Set<string>();
    activeRound?.leftTiles?.forEach((t) => {
      if (t.resolved)
        newLeft.add(t.key);
    });
    setMatchedLeftKeys(newLeft);

    const newRight = new Set<string>();
    activeRound?.rightTiles?.forEach((t) => {
      if (t.matched)
        newRight.add(t.key);
    });
    setMatchedRightKeys(newRight);

    contentFade.setValue(0);
    RNAnimated.timing(contentFade, {
      toValue: 1,
      duration: 350,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [activeRound, contentFade]);

  // Execute pair attempt with server
  const submitPairAttempt = (leftKey: string, rightKey: string) => {
    if (attemptMutation.isPending || !activeRound)
      return;

    attemptMutation.mutate(
      {
        quizId: quiz.quizId,
        roundNo: activeRound.roundNo,
        data: { leftTileKey: leftKey, rightTileKey: rightKey },
        idempotencyKey,
      },
      {
        onSuccess: (data) => {
          if (data.correct && data.resolved) {
            playSuccessChime();
            const updatedLeft = new Set(matchedLeftKeys);
            updatedLeft.add(leftKey);
            setMatchedLeftKeys(updatedLeft);

            const updatedRight = new Set(matchedRightKeys);
            updatedRight.add(rightKey);
            setMatchedRightKeys(updatedRight);

            setSelectedLeftKey(null);
            setSelectedRightKey(null);
            setIdempotencyKey(generateIdempotencyKey()); // Fresh key for next pair

            setMascotPose('nhay_len');
            setMascotAnim('celebrate');
            setBubbleText('Ghép đôi chính xác! Tuyệt vời! ✨');

            // Check round completion
            const isRoundDone = data.round.completed || updatedLeft.size >= activeRound.totalPairs;
            if (isRoundDone) {
              if (currentRoundIndex + 1 < matchingRounds.length) {
                // Next round available
                setTimeout(() => {
                  setCurrentRoundIndex(r => r + 1);
                }, 700);
              }
              else {
                // All rounds finished! Finalize session
                setTimeout(() => {
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
                }, 700);
              }
            }
          }
          else {
            // Incorrect match
            playErrorBuzz();
            setFailedKeys(new Set([leftKey, rightKey]));
            setMascotPose('bat_ngo');
            setMascotAnim('shake');
            setBubbleText('Chưa chính xác! Thử lại nhé! 🤔');

            setTimeout(() => {
              setSelectedLeftKey(null);
              setSelectedRightKey(null);
              setFailedKeys(new Set());
              setIdempotencyKey(generateIdempotencyKey()); // Fresh key for next attempt
            }, 600);
          }
        },
        onError: (error) => {
          handleExpiredSession(error);
          // Keep idempotencyKey so retry re-sends same key
        },
      },
    );
  };

  // Handle tile tap: Left
  const handleLeftTap = (tileKey: string, label: string) => {
    if (matchedLeftKeys.has(tileKey) || failedKeys.size > 0 || attemptMutation.isPending)
      return;

    if (quiz.direction === 'EN_VI') {
      pronounceWord(label);
    }

    if (selectedLeftKey === tileKey) {
      setSelectedLeftKey(null);
      return;
    }

    setSelectedLeftKey(tileKey);

    if (selectedRightKey) {
      submitPairAttempt(tileKey, selectedRightKey);
    }
  };

  // Handle tile tap: Right
  const handleRightTap = (tileKey: string, label: string) => {
    if (matchedRightKeys.has(tileKey) || failedKeys.size > 0 || attemptMutation.isPending)
      return;

    if (quiz.direction === 'VI_EN') {
      pronounceWord(label);
    }

    if (selectedRightKey === tileKey) {
      setSelectedRightKey(null);
      return;
    }

    setSelectedRightKey(tileKey);

    if (selectedLeftKey) {
      submitPairAttempt(selectedLeftKey, tileKey);
    }
  };

  const handleExitConfirm = () => {
    setShowExitModal(false);
    cancelMutation.mutate({ quizId: quiz.quizId });
    onExit();
  };

  // Overall progress across rounds
  const totalPairsOverall = matchingRounds.reduce((acc, r) => acc + r.totalPairs, 0);
  const matchedOverall = (currentRoundIndex * (activeRound?.totalPairs || 5)) + matchedLeftKeys.size;
  const progressPercent = totalPairsOverall > 0 ? (matchedOverall / totalPairsOverall) * 100 : 0;

  return (
    <SafeAreaView className="flex-1 bg-[#F7F8FA]" edges={['top', 'bottom']}>

      {/* 1. TOP PROGRESS BAR */}
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
              className="h-full rounded-full bg-purple-500"
              style={{ width: `${progressPercent}%` }}
            />
          </View>
        </View>

        {/* Live Stopwatch Badge */}
        <View className="mr-2 flex-row items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-2.5 py-1 shadow-sm">
          <ClockIcon size={13} className="text-purple-600" />
          <Text className="font-inter text-[12px] font-bold text-neutral-600 tabular-nums">
            {formatTimer(elapsedSeconds)}
          </Text>
        </View>

        <Text className="text-right font-nunito text-[15px] font-extrabold text-neutral-500 tabular-nums">
          Vòng
          {' '}
          {currentRoundIndex + 1}
          /
          {matchingRounds.length}
        </Text>
      </View>

      {/* 2. BODY CONTENT */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <RNAnimated.View style={{ opacity: contentFade, flex: 1 }}>

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

          {/* DUAL COLUMN MATCHING GRID */}
          <View className="flex-1 flex-row gap-3">

            {/* LEFT COLUMN */}
            <View className="flex-1 gap-2.5">
              <Text className="mb-1 text-center font-inter text-[12px] font-bold tracking-wider text-neutral-400 uppercase">
                {quiz.direction === 'VI_EN' ? 'Tiếng Việt' : 'Tiếng Anh'}
              </Text>
              {activeRound?.leftTiles?.map((tile) => {
                const isMatched = matchedLeftKeys.has(tile.key);
                const isSelected = selectedLeftKey === tile.key;
                const isFailed = failedKeys.has(tile.key);

                return (
                  <TouchableOpacity
                    key={tile.key}
                    onPress={() => handleLeftTap(tile.key, tile.label)}
                    disabled={isMatched || attemptMutation.isPending}
                    activeOpacity={0.8}
                    className={cn(
                      'min-h-[58px] justify-center rounded-2xl border-2 p-3 transition-all',
                      isMatched
                        ? 'border-neutral-200 bg-neutral-100 opacity-30'
                        : isFailed
                          ? 'border-error-500 bg-error-50'
                          : isSelected
                            ? 'border-b-4 border-purple-500 bg-purple-50'
                            : 'border-b-[3px] border-neutral-200 bg-white active:bg-neutral-50',
                    )}
                  >
                    <Text
                      className={cn(
                        'text-center font-nunito text-[15px] font-extrabold',
                        isMatched
                          ? 'text-neutral-400'
                          : isFailed
                            ? 'text-error-700'
                            : isSelected
                              ? 'text-purple-700'
                              : 'text-mascot-navy',
                      )}
                    >
                      {tile.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* RIGHT COLUMN */}
            <View className="flex-1 gap-2.5">
              <Text className="mb-1 text-center font-inter text-[12px] font-bold tracking-wider text-neutral-400 uppercase">
                {quiz.direction === 'VI_EN' ? 'Tiếng Anh' : 'Tiếng Việt'}
              </Text>
              {activeRound?.rightTiles?.map((tile) => {
                const isMatched = matchedRightKeys.has(tile.key);
                const isSelected = selectedRightKey === tile.key;
                const isFailed = failedKeys.has(tile.key);

                return (
                  <TouchableOpacity
                    key={tile.key}
                    onPress={() => handleRightTap(tile.key, tile.label)}
                    disabled={isMatched || attemptMutation.isPending}
                    activeOpacity={0.8}
                    className={cn(
                      'min-h-[58px] justify-center rounded-2xl border-2 p-3 transition-all',
                      isMatched
                        ? 'border-neutral-200 bg-neutral-100 opacity-30'
                        : isFailed
                          ? 'border-error-500 bg-error-50'
                          : isSelected
                            ? 'border-b-4 border-purple-500 bg-purple-50'
                            : 'border-b-[3px] border-neutral-200 bg-white active:bg-neutral-50',
                    )}
                  >
                    <Text
                      className={cn(
                        'text-center font-nunito text-[14px] font-bold',
                        isMatched
                          ? 'text-neutral-400'
                          : isFailed
                            ? 'text-error-700'
                            : isSelected
                              ? 'text-purple-700'
                              : 'text-mascot-navy',
                      )}
                    >
                      {tile.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

          </View>

        </RNAnimated.View>
      </ScrollView>

      {/* 3. ATTEMPT SPINNER FOOTER (IF NETWORK PENDING) */}
      {attemptMutation.isPending && (
        <View className="flex-row items-center justify-center gap-2 border-t border-neutral-100 bg-white py-3">
          <ActivityIndicator size="small" color="#9333EA" />
          <Text className="font-nunito text-[14px] font-extrabold text-purple-600">Đang chấm cặp ghép...</Text>
        </View>
      )}

      {/* 4. EXIT CONFIRMATION MODAL */}
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

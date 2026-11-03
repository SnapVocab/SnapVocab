/* eslint-disable max-lines-per-function */
import type { QuizPlayDTO } from '../types';
import type { SnapyPose } from '@/components/ui/snapy';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
  ClockIcon,
  CloseIcon,
} from '@/components/ui/icons';
import { Snapy } from '@/components/ui/snapy';
import { useTts } from '@/lib/hooks/use-tts';
import { translate } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useAttemptMatchingPair } from '../api/quiz-api';
import { useExpiredSessionHandler } from '../hooks/use-expired-session-handler';
import { useFinishQuiz } from '../hooks/use-finish-quiz';
import { classifyQuizError } from '../utils';
import { generateIdempotencyKey } from '../utils/idempotency';
import { QuizExitModal } from './quiz-exit-modal';

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

export type MatchingQuizViewProps = {
  quiz: QuizPlayDTO;
  onExit: () => void;
  /** Reload the session from the server when it moved on (pair matched elsewhere, terminal). */
  onResync: () => void;
};

const SCORING_RULE = 'quiz.matching_scoring_rule';

export function MatchingQuizView({ quiz, onExit, onResync }: MatchingQuizViewProps) {
  const matchingRounds = quiz.matchingRounds || [];
  const { speak } = useTts();

  // Resume at the first round the server has not completed (D18); the Session screen handles "all done".
  const [currentRoundIndex, setCurrentRoundIndex] = useState(
    () => Math.max(0, matchingRounds.findIndex(r => !r.completed)),
  );
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
  // A pair whose attempt may have been committed: tiles stay locked until the SAME pair with the
  // SAME key is confirmed, so a replayed response always describes the pair on screen.
  const [unconfirmedPair, setUnconfirmedPair] = useState<{ left: string; right: string } | null>(null);
  const [allRoundsDone, setAllRoundsDone] = useState(false);

  // Mascot and modal state
  const [mascotPose, setMascotPose] = useState<SnapyPose>('tap_trung');
  const [mascotAnim, setMascotAnim] = useState<string>('idle');
  const [bubbleText, setBubbleText] = useState<string>(translate(SCORING_RULE));
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
  const finishQuiz = useFinishQuiz(quiz.quizId, onResync);
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
          setUnconfirmedPair(null);
          // Reconcile from the response: on a replay it describes the pair the server recorded.
          if (data.correct) {
            playSuccessChime();
            setMatchedLeftKeys(prev => new Set(prev).add(data.leftTileKey));
            setMatchedRightKeys(prev => new Set(prev).add(data.rightTileKey));

            setSelectedLeftKey(null);
            setSelectedRightKey(null);
            setIdempotencyKey(generateIdempotencyKey()); // Fresh key for next pair

            setMascotPose('nhay_len');
            setMascotAnim('celebrate');
            // `correct` = this pair is right; `outcome` = what the pair scores (first attempt only).
            setBubbleText(data.outcome === 'CORRECT'
              ? translate('quiz.match_first_try_correct')
              : translate('quiz.match_correct_no_score'));

            if (data.round.completed) {
              if (currentRoundIndex + 1 < matchingRounds.length) {
                setTimeout(() => {
                  setCurrentRoundIndex(r => r + 1);
                }, 700);
              }
              else {
                setAllRoundsDone(true);
                setTimeout(() => {
                  finishQuiz.finish();
                }, 700);
              }
            }
          }
          else {
            playErrorBuzz();
            setFailedKeys(new Set([data.leftTileKey, data.rightTileKey]));
            setMascotPose('bat_ngo');
            setMascotAnim('shake');
            setBubbleText(data.attemptNo === 1
              ? translate('quiz.match_first_try_wrong')
              : translate('quiz.match_try_again'));

            setTimeout(() => {
              setSelectedLeftKey(null);
              setSelectedRightKey(null);
              setFailedKeys(new Set());
              setIdempotencyKey(generateIdempotencyKey()); // Fresh key for next attempt
            }, 600);
          }
        },
        onError: (error) => {
          if (handleExpiredSession(error))
            return;
          const kind = classifyQuizError(error);
          if (kind === 'RESYNC') {
            onResync();
          }
          else if (kind === 'REJECTED') {
            setSelectedLeftKey(null);
            setSelectedRightKey(null);
            setIdempotencyKey(generateIdempotencyKey());
            setBubbleText(translate('quiz.match_send_error'));
          }
          else {
            setUnconfirmedPair({ left: leftKey, right: rightKey });
          }
        },
      },
    );
  };

  const tilesLocked = attemptMutation.isPending || failedKeys.size > 0 || unconfirmedPair !== null || allRoundsDone;

  // Handle tile tap: Left
  const handleLeftTap = (tileKey: string, label: string) => {
    if (matchedLeftKeys.has(tileKey) || tilesLocked)
      return;

    if (quiz.direction === 'EN_VI') {
      speak(label);
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
    if (matchedRightKeys.has(tileKey) || tilesLocked)
      return;

    if (quiz.direction === 'VI_EN') {
      speak(label);
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

  // Overall progress across rounds
  const totalPairsOverall = matchingRounds.reduce((acc, r) => acc + r.totalPairs, 0);
  const matchedOverall = (currentRoundIndex * (activeRound?.totalPairs || 5)) + matchedLeftKeys.size;
  const progressPercent = totalPairsOverall > 0 ? (matchedOverall / totalPairsOverall) * 100 : 0;

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background" edges={['top', 'bottom']}>

      {/* 1. TOP PROGRESS BAR */}
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
              className="h-full rounded-full bg-purple-500"
              style={{ width: `${progressPercent}%` }}
            />
          </View>
        </View>

        {/* Live Stopwatch Badge */}
        <View className="mr-2 flex-row items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 shadow-sm">
          <ClockIcon size={13} className="text-purple-600 dark:text-purple-300" />
          <Text className="font-inter text-[12px] font-bold text-neutral-600 tabular-nums dark:text-neutral-300">
            {formatTimer(elapsedSeconds)}
          </Text>
        </View>

        <Text className="text-right font-nunito text-[15px] font-extrabold text-neutral-500 tabular-nums dark:text-neutral-400">
          {translate('quiz.round')}
          {' '}
          {currentRoundIndex + 1}
          /
          {matchingRounds.length}
        </Text>
      </View>

      {/* 2. BODY CONTENT */}
      <ScrollView
        style={{ flex: 1 }}
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <RNAnimated.View style={{ opacity: contentFade, flex: 1 }}>

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

          {/* DUAL COLUMN MATCHING GRID */}
          <View className="flex-1 flex-row gap-3">

            {/* LEFT COLUMN */}
            <View className="flex-1 gap-2.5">
              <Text className="mb-1 text-center font-inter text-[12px] font-bold tracking-wider text-neutral-400 uppercase">
                {quiz.direction === 'VI_EN' ? translate('quiz.vietnamese') : translate('quiz.english')}
              </Text>
              {activeRound?.leftTiles?.map((tile) => {
                const isMatched = matchedLeftKeys.has(tile.key);
                const isSelected = selectedLeftKey === tile.key;
                const isFailed = failedKeys.has(tile.key);

                return (
                  <TouchableOpacity
                    key={tile.key}
                    onPress={() => handleLeftTap(tile.key, tile.label)}
                    disabled={isMatched || tilesLocked}
                    accessibilityState={{ selected: isSelected, disabled: isMatched || tilesLocked }}
                    activeOpacity={0.8}
                    className={cn(
                      'min-h-[58px] justify-center rounded-2xl border-2 p-3 transition-all',
                      isMatched
                        ? 'border-line bg-muted opacity-30'
                        : isFailed
                          ? 'border-error-500 bg-error-50 dark:bg-error-500/15'
                          : isSelected
                            ? 'border-b-4 border-purple-500 bg-purple-50 dark:bg-purple-500/15'
                            : 'border-b-[3px] border-line bg-surface active:bg-pressed',
                    )}
                  >
                    <Text
                      className={cn(
                        'text-center font-nunito text-[15px] font-extrabold',
                        isMatched
                          ? 'text-neutral-400'
                          : isFailed
                            ? 'text-error-700 dark:text-error-300'
                            : isSelected
                              ? 'text-purple-700 dark:text-purple-300'
                              : 'text-mascot-navy dark:text-neutral-50',
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
                {quiz.direction === 'VI_EN' ? translate('quiz.english') : translate('quiz.vietnamese')}
              </Text>
              {activeRound?.rightTiles?.map((tile) => {
                const isMatched = matchedRightKeys.has(tile.key);
                const isSelected = selectedRightKey === tile.key;
                const isFailed = failedKeys.has(tile.key);

                return (
                  <TouchableOpacity
                    key={tile.key}
                    onPress={() => handleRightTap(tile.key, tile.label)}
                    disabled={isMatched || tilesLocked}
                    accessibilityState={{ selected: isSelected, disabled: isMatched || tilesLocked }}
                    activeOpacity={0.8}
                    className={cn(
                      'min-h-[58px] justify-center rounded-2xl border-2 p-3 transition-all',
                      isMatched
                        ? 'border-line bg-muted opacity-30'
                        : isFailed
                          ? 'border-error-500 bg-error-50 dark:bg-error-500/15'
                          : isSelected
                            ? 'border-b-4 border-purple-500 bg-purple-50 dark:bg-purple-500/15'
                            : 'border-b-[3px] border-line bg-surface active:bg-pressed',
                    )}
                  >
                    <Text
                      className={cn(
                        'text-center font-nunito text-[14px] font-bold',
                        isMatched
                          ? 'text-neutral-400'
                          : isFailed
                            ? 'text-error-700 dark:text-error-300'
                            : isSelected
                              ? 'text-purple-700 dark:text-purple-300'
                              : 'text-mascot-navy dark:text-neutral-50',
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
        <View className="flex-row items-center justify-center gap-2 border-t border-line bg-surface py-3">
          <ActivityIndicator size="small" color="#9333EA" />
          <Text className="font-nunito text-[14px] font-extrabold text-purple-600 dark:text-purple-300">{translate('quiz.grading_pair')}</Text>
        </View>
      )}

      {/* 4. UNCONFIRMED PAIR: resend exactly the same attempt */}
      {unconfirmedPair && !attemptMutation.isPending && (
        <View className="gap-2 border-t border-line bg-surface p-4">
          <Text accessibilityLiveRegion="polite" className="text-center font-inter text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
            {translate('quiz.match_unconfirmed')}
          </Text>
          <Pressable
            onPress={() => submitPairAttempt(unconfirmedPair.left, unconfirmedPair.right)}
            className="h-12 w-full items-center justify-center rounded-xl border-b-2 border-purple-700 bg-purple-500 active:bg-purple-600"
          >
            <Text className="font-nunito text-[15px] font-extrabold text-white">{translate('quiz.resend')}</Text>
          </Pressable>
        </View>
      )}

      {/* 5. ALL ROUNDS MATCHED: completion stays reachable if the first complete call failed */}
      {allRoundsDone && (
        <View className="border-t border-line bg-surface p-4">
          <Pressable
            onPress={finishQuiz.finish}
            disabled={finishQuiz.isPending}
            accessibilityState={{ busy: finishQuiz.isPending }}
            className="h-12 w-full items-center justify-center rounded-xl border-b-2 border-purple-700 bg-purple-500 active:bg-purple-600"
          >
            {finishQuiz.isPending
              ? <ActivityIndicator size="small" color="#FFFFFF" />
              : <Text className="font-nunito text-[15px] font-extrabold text-white">{translate('quiz.finish_quiz')}</Text>}
          </Pressable>
        </View>
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

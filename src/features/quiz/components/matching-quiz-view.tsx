/* eslint-disable max-lines-per-function */
import type { SnapyPose } from '@/components/ui/snapy';
import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
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
  CheckCircleIcon,
  ClockIcon,
  CloseIcon,
  FlameIcon,
  LogOutIcon,
  SparklesIcon,
  VolumeIcon,
  XCircleIcon,
  ZapIcon,
} from '@/components/ui/icons';
import { Snapy } from '@/components/ui/snapy';
import { cn } from '@/lib/utils';

// ==========================================
// TYPES & DATA POOL (20 VOCABULARY PAIRS)
// ==========================================
export type MatchingPair = {
  id: string;
  word: string;
  ipa: string;
  meaning: string;
};

export type MatchingResult = {
  score: number;
  total: number;
  xp: number;
  coin: number;
  time: string;
  wrongAnswers: Array<{
    id: string;
    word: string;
    ipa?: string;
    correct: string;
    yours: string;
  }>;
};

const MATCHING_POOL: MatchingPair[] = [
  { id: 'm1', word: 'abandon', ipa: '/əˈbændən/', meaning: 'Từ bỏ, ruồng bỏ' },
  { id: 'm2', word: 'achieve', ipa: '/əˈtʃiːv/', meaning: 'Đạt được, hoàn thành' },
  { id: 'm3', word: 'boarding pass', ipa: '/ˈbɔːrdɪŋ pæs/', meaning: 'Thẻ lên máy bay' },
  { id: 'm4', word: 'departure', ipa: '/dɪˈpɑːrtʃər/', meaning: 'Sự khởi hành, xuất phát' },
  { id: 'm5', word: 'destination', ipa: '/ˌdestɪˈneɪʃn/', meaning: 'Điểm đến, đích đến' },
  { id: 'm6', word: 'improve', ipa: '/ɪmˈpruːv/', meaning: 'Cải thiện, tiến bộ' },
  { id: 'm7', word: 'luggage', ipa: '/ˈlʌɡɪdʒ/', meaning: 'Hành lý, vali' },
  { id: 'm8', word: 'efficient', ipa: '/ɪˈfɪʃnt/', meaning: 'Hiệu quả, năng suất' },
  { id: 'm9', word: 'flight attendant', ipa: '/ˈflaɪt əˌtendənt/', meaning: 'Tiếp viên hàng không' },
  { id: 'm10', word: 'delay', ipa: '/dɪˈleɪ/', meaning: 'Sự trì hoãn, chậm trễ' },
  { id: 'm11', word: 'itinerary', ipa: '/aɪˈtɪnəreri/', meaning: 'Lịch trình chuyến đi' },
  { id: 'm12', word: 'reservation', ipa: '/ˌrezərˈveɪʃn/', meaning: 'Sự đặt chỗ trước' },
  { id: 'm13', word: 'customs', ipa: '/ˈkʌstəmz/', meaning: 'Hải quan, kiểm thuế' },
  { id: 'm14', word: 'terminal', ipa: '/ˈtɜːrmɪnl/', meaning: 'Nhà ga sân bay' },
  { id: 'm15', word: 'passport', ipa: '/ˈpæspɔːrt/', meaning: 'Hộ chiếu xuất nhập cảnh' },
  { id: 'm16', word: 'passenger', ipa: '/ˈpæsɪndʒər/', meaning: 'Hành khách đi xe/bay' },
  { id: 'm17', word: 'negotiate', ipa: '/nɪˈɡoʊʃieɪt/', meaning: 'Đàm phán, thương lượng' },
  { id: 'm18', word: 'contract', ipa: '/ˈkɑːntrækt/', meaning: 'Bản hợp đồng kinh tế' },
  { id: 'm19', word: 'colleague', ipa: '/ˈkɑːliːɡ/', meaning: 'Đồng nghiệp cơ quan' },
  { id: 'm20', word: 'presentation', ipa: '/ˌpriːzenˈteɪʃn/', meaning: 'Bài thuyết trình báo cáo' },
];

// Web Audio Synthesizer for high-fidelity audio feedback
function playSuccessChime() {
  if (typeof window === 'undefined')
    return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass)
      return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Two-tone cheerful ding
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.setValueAtTime(659.25, now + 0.08); // E5
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

// Pronounce English word via Web Speech API
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
  quizId?: number;
  count?: number;
  reviewWrong?: boolean;
  wrongData?: string;
  onExit: () => void;
  onComplete: (result: MatchingResult) => void;
  isCompleting?: boolean;
};

type TileItem = {
  id: string; // matches pair.id
  pairId: string;
  text: string;
  ipa?: string;
  type: 'word' | 'meaning';
};

export function MatchingQuizView({
  count = 5,
  reviewWrong = false,
  wrongData,
  onExit,
  onComplete,
}: MatchingQuizViewProps) {
  // 1. Prepare target pool of pairs (no underfill bug)
  const allPairs = useMemo<MatchingPair[]>(() => {
    if (reviewWrong && wrongData) {
      try {
        const parsed = JSON.parse(wrongData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any, idx: number) => ({
            id: `rw_${idx}`,
            word: item.word,
            ipa: item.ipa || '/.../',
            meaning: item.correct || item.meaning,
          }));
        }
      }
      catch {
        // fallback
      }
    }
    const targetCount = Math.max(1, count);
    const pairs: MatchingPair[] = [];
    for (let i = 0; i < targetCount; i++) {
      const base = MATCHING_POOL[i % MATCHING_POOL.length];
      pairs.push({
        ...base,
        id: `${base.id}_${i}`,
      });
    }
    return pairs;
  }, [count, reviewWrong, wrongData]);

  // Round pagination: display up to 5 pairs per round for optimal mobile screen ergonomics
  const PAIRS_PER_ROUND = 5;
  const totalRounds = Math.ceil(allPairs.length / PAIRS_PER_ROUND);
  const [currentRound, setCurrentRound] = useState(0);

  const roundPairs = useMemo<MatchingPair[]>(() => {
    const start = currentRound * PAIRS_PER_ROUND;
    return allPairs.slice(start, start + PAIRS_PER_ROUND);
  }, [allPairs, currentRound]);

  // Shuffled columns for current round
  const [wordTiles, setWordTiles] = useState<TileItem[]>([]);
  const [meaningTiles, setMeaningTiles] = useState<TileItem[]>([]);

  // Selection state
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [selectedMeaningId, setSelectedMeaningId] = useState<string | null>(null);
  const [matchedPairIds, setMatchedPairIds] = useState<Set<string>>(new Set());
  const [failedPairPairIds, setFailedPairPairIds] = useState<Set<string>>(new Set());

  // Game tracking
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [totalMatched, setTotalMatched] = useState(0);
  const [firstTrySuccesses, setFirstTrySuccesses] = useState(0);
  const [hasAttemptedPair, setHasAttemptedPair] = useState<{ [pairId: string]: boolean }>({});
  const [wrongAnswers, setWrongAnswers] = useState<Array<{
    id: string;
    word: string;
    ipa?: string;
    correct: string;
    yours: string;
  }>>([]);

  // Mascot & Modal state
  const [mascotPose, setMascotPose] = useState<SnapyPose>('tap_trung');
  const [mascotAnim, setMascotAnim] = useState<string>('idle');
  const [bubbleText, setBubbleText] = useState<string>('Chạm vào từ tiếng Anh & nghĩa tiếng Việt!');
  const [showExitModal, setShowExitModal] = useState(false);
  const startTimeRef = useRef<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    startTimeRef.current = Date.now();
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

  // Animation values
  const shakeAnim = useRef(new RNAnimated.Value(0)).current;
  const comboScale = useRef(new RNAnimated.Value(1)).current;
  const contentFade = useRef(new RNAnimated.Value(0)).current;

  // Initialize round tiles
  useEffect(() => {
    const words: TileItem[] = roundPairs.map(p => ({
      id: `w_${p.id}`,
      pairId: p.id,
      text: p.word,
      ipa: p.ipa,
      type: 'word' as const,
    })).sort(() => Math.random() - 0.5);

    const meanings: TileItem[] = roundPairs.map(p => ({
      id: `m_${p.id}`,
      pairId: p.id,
      text: p.meaning,
      type: 'meaning' as const,
    })).sort(() => Math.random() - 0.5);

    setWordTiles(words);
    setMeaningTiles(meanings);
    setSelectedWordId(null);
    setSelectedMeaningId(null);

    // Entrance fade
    contentFade.setValue(0);
    RNAnimated.timing(contentFade, {
      toValue: 1,
      duration: 350,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [roundPairs]);

  // Handle tile tap: Left (Word)
  const handleWordTap = (tile: TileItem) => {
    if (matchedPairIds.has(tile.pairId) || failedPairPairIds.size > 0)
      return;

    pronounceWord(tile.text);

    if (selectedWordId === tile.pairId) {
      // Deselect
      setSelectedWordId(null);
      return;
    }

    setSelectedWordId(tile.pairId);

    // If meaning was already selected, check match
    if (selectedMeaningId) {
      checkMatch(tile.pairId, selectedMeaningId);
    }
  };

  // Handle tile tap: Right (Meaning)
  const handleMeaningTap = (tile: TileItem) => {
    if (matchedPairIds.has(tile.pairId) || failedPairPairIds.size > 0)
      return;

    if (selectedMeaningId === tile.pairId) {
      // Deselect
      setSelectedMeaningId(null);
      return;
    }

    setSelectedMeaningId(tile.pairId);

    // If word was already selected, check match
    if (selectedWordId) {
      checkMatch(selectedWordId, tile.pairId);
    }
  };

  // Evaluate match
  const checkMatch = (wordPairId: string, meaningPairId: string) => {
    const isCorrect = wordPairId === meaningPairId;

    if (isCorrect) {
      // SUCCESS MATCH
      playSuccessChime();
      const updatedMatched = new Set(matchedPairIds);
      updatedMatched.add(wordPairId);
      setMatchedPairIds(updatedMatched);

      const nextMatchedCount = totalMatched + 1;
      setTotalMatched(nextMatchedCount);

      // Check first-try accuracy
      if (!hasAttemptedPair[wordPairId]) {
        setFirstTrySuccesses(s => s + 1);
      }

      // Combo handling
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      if (nextCombo > maxCombo)
        setMaxCombo(nextCombo);

      // Animate combo pill
      RNAnimated.sequence([
        RNAnimated.timing(comboScale, { toValue: 1.3, duration: 120, useNativeDriver: true }),
        RNAnimated.spring(comboScale, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }),
      ]).start();

      // Mascot reaction
      if (nextCombo >= 3) {
        setMascotPose('an_mung');
        setMascotAnim('celebrate');
        setBubbleText(`🔥 Tuyệt đỉnh! Combo x${nextCombo}!`);
      }
      else {
        setMascotPose('nhay_len');
        setMascotAnim('bounce');
        setBubbleText('Chính xác! Nối rất chuẩn! ✨');
      }

      // Clear selection
      setSelectedWordId(null);
      setSelectedMeaningId(null);

      // Check round or game finish
      const allRoundMatched = roundPairs.every(p => updatedMatched.has(p.id));
      if (allRoundMatched) {
        handleRoundOrGameEnd();
      }
    }
    else {
      // INCORRECT MATCH
      playErrorBuzz();
      const failed = new Set<string>();
      failed.add(wordPairId);
      failed.add(meaningPairId);
      setFailedPairPairIds(failed);

      // Mark that this pair was attempted and failed
      setHasAttemptedPair(prev => ({
        ...prev,
        [wordPairId]: true,
        [meaningPairId]: true,
      }));

      // Record wrong answer
      const targetPair = allPairs.find(p => p.id === wordPairId);
      const chosenPair = allPairs.find(p => p.id === meaningPairId);
      if (targetPair && chosenPair) {
        setWrongAnswers(prev => [
          ...prev,
          {
            id: targetPair.id,
            word: targetPair.word,
            ipa: targetPair.ipa,
            correct: targetPair.meaning,
            yours: chosenPair.meaning,
          },
        ]);
      }

      // Combo reset
      setCombo(0);

      // Shake animation
      shakeAnim.setValue(0);
      RNAnimated.sequence([
        RNAnimated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
        RNAnimated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
        RNAnimated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        RNAnimated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        RNAnimated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();

      // Mascot reaction
      setMascotPose('bat_ngo');
      setMascotAnim('shake');
      setBubbleText('Chưa đúng rồi! Thử lại nhé! 🤔');

      // Clear after brief display
      setTimeout(() => {
        setFailedPairPairIds(new Set());
        setSelectedWordId(null);
        setSelectedMeaningId(null);
        setMascotPose('tap_trung');
        setMascotAnim('idle');
      }, 550);
    }
  };

  const handleRoundOrGameEnd = () => {
    if (currentRound + 1 < totalRounds) {
      // Advance to next round after short delay
      setBubbleText('Xuất sắc! Chuẩn bị vòng tiếp theo...');
      setTimeout(() => {
        setCurrentRound(r => r + 1);
        setMascotPose('tu_hao');
        setBubbleText('Tiếp tục ghép các cặp từ mới nào! 🚀');
      }, 600);
    }
    else {
      // ALL ROUNDS COMPLETED!
      setMascotPose('tu_hao');
      setMascotAnim('celebrate');
      setBubbleText('HOÀN THÀNH TẤT CẢ! Đỉnh chóp! 🏆');

      setTimeout(() => {
        const finalScore = firstTrySuccesses + (wrongAnswers.length === 0 ? 0 : 0);
        const totalCount = allPairs.length;
        const xpEarned = totalCount * 10 + maxCombo * 2;
        const coinEarned = totalCount * 5;

        onComplete({
          score: Math.max(finalScore, totalCount - wrongAnswers.length),
          total: totalCount,
          xp: xpEarned,
          coin: coinEarned,
          time: formatTimer(elapsedSeconds),
          wrongAnswers,
        });
      }, 700);
    }
  };

  const progressPercent = Math.min(100, (totalMatched / allPairs.length) * 100);

  return (
    <SafeAreaView className="flex-1 bg-[#F7F8FA]" edges={['top', 'bottom']}>
      {/* 1. TOP HEADER & PROGRESS */}
      <View className="z-10 flex-row items-center justify-between border-b border-neutral-100 bg-[#F7F8FA] px-4 py-3">
        <TouchableOpacity
          onPress={() => setShowExitModal(true)}
          activeOpacity={0.7}
          className="-ml-2 size-10 items-center justify-center rounded-full"
        >
          <CloseIcon size={24} className="text-neutral-500" />
        </TouchableOpacity>

        {/* Progress bar */}
        <View className="mx-3 flex-1">
          <View className="h-3.5 w-full overflow-hidden rounded-full bg-neutral-200">
            <View
              className="h-full rounded-full bg-primary-500"
              style={{ width: `${progressPercent}%` }}
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

        {/* Counter */}
        <View className="flex-row items-center gap-1.5">
          {combo >= 2 && (
            <RNAnimated.View
              style={{ transform: [{ scale: comboScale }] }}
              className="flex-row items-center gap-1 rounded-full border border-warning-300 bg-warning-100 px-2 py-0.5"
            >
              <FlameIcon size={14} className="fill-warning-500 text-warning-600" />
              <Text className="font-nunito text-[12px] font-extrabold text-warning-700">
                x
                {combo}
              </Text>
            </RNAnimated.View>
          )}
          <Text className="font-nunito text-[15px] font-extrabold text-neutral-600 tabular-nums">
            {totalMatched}
            /
            {allPairs.length}
          </Text>
        </View>
      </View>

      {/* 2. ROUND INDICATOR & MASCOT PROMPT */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <View className="flex-row items-center gap-2">
          <View className="size-8 items-center justify-center rounded-xl border border-primary-200 bg-primary-100">
            <ZapIcon size={16} className="fill-primary-500 text-primary-600" />
          </View>
          <View>
            <Text className="font-nunito text-[16px] font-extrabold text-mascot-navy">
              Ghép đôi từ vựng
            </Text>
            <Text className="font-inter text-[12px] font-bold text-neutral-400">
              Vòng
              {' '}
              {currentRound + 1}
              {' '}
              /
              {' '}
              {totalRounds}
              {' '}
              • Chạm 2 thẻ tương ứng
            </Text>
          </View>
        </View>

        {/* Snapy Avatar Avatar & Bubble */}
        <View className="flex-row items-center gap-2">
          <View style={{ width: 48, height: 48 }} className="items-center justify-center">
            <Snapy pose={mascotPose} animation={mascotAnim} style={{ width: 48, height: 48 }} />
          </View>
        </View>
      </View>

      {/* Mascot Speech Helper Banner */}
      <View className="mx-4 mb-2.5 flex-row items-center gap-2 rounded-2xl border border-neutral-100 bg-white px-3.5 py-2 shadow-sm shadow-black/5">
        <SparklesIcon size={14} className="text-warning-500" />
        <Text className="flex-1 font-inter text-[13px] font-bold text-neutral-600" numberOfLines={1}>
          {bubbleText}
        </Text>
      </View>

      {/* 3. MATCHING PLAYGROUND (2 COLUMNS) */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <RNAnimated.View
          style={{
            opacity: contentFade,
            transform: [{ translateX: shakeAnim }],
            flex: 1,
          }}
          className="flex-row gap-3 pt-1"
        >
          {/* LEFT COLUMN: ENGLISH WORDS */}
          <View className="flex-1 gap-3">
            <Text className="mb-0.5 text-center text-[12px] font-extrabold tracking-wider text-neutral-400 uppercase">
              Từ tiếng Anh
            </Text>
            {wordTiles.map((tile) => {
              const isMatched = matchedPairIds.has(tile.pairId);
              const isSelected = selectedWordId === tile.pairId;
              const isFailed = failedPairPairIds.has(tile.pairId) && isSelected;

              let cardBg = 'bg-white border-neutral-200 border-b-[4px]';
              let textClass = 'text-mascot-navy';

              if (isMatched) {
                cardBg = 'bg-success-50 border-success-400 border-b-[2px]';
                textClass = 'text-success-800 line-through';
              }
              else if (isFailed) {
                cardBg = 'bg-error-50 border-error-500 border-b-[4px]';
                textClass = 'text-error-700';
              }
              else if (isSelected) {
                cardBg = 'bg-primary-50 border-primary-500 border-b-[4px]';
                textClass = 'text-primary-800 font-black';
              }

              return (
                <TouchableOpacity
                  key={tile.id}
                  onPress={() => handleWordTap(tile)}
                  disabled={isMatched}
                  activeOpacity={0.8}
                  style={isMatched ? { opacity: 0.4 } : isSelected ? { transform: [{ scale: 1.02 }] } : undefined}
                  className={cn(
                    'min-h-[78px] justify-center rounded-2xl border-2 p-3',
                    cardBg,
                  )}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-1.5">
                      <Text className={cn('font-nunito text-[15px] leading-tight font-extrabold', textClass)}>
                        {tile.text}
                      </Text>
                      {tile.ipa && (
                        <Text className="mt-0.5 font-inter text-[11px] font-medium text-neutral-400">
                          {tile.ipa}
                        </Text>
                      )}
                    </View>

                    {isMatched
                      ? (
                          <CheckCircleIcon size={18} className="shrink-0 text-success-500" />
                        )
                      : isFailed
                        ? (
                            <XCircleIcon size={18} className="shrink-0 text-error-500" />
                          )
                        : (
                            <View className="size-6 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100">
                              <VolumeIcon size={12} className={isSelected ? 'text-primary-600' : 'text-neutral-400'} />
                            </View>
                          )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* RIGHT COLUMN: VIETNAMESE MEANINGS */}
          <View className="flex-1 gap-3">
            <Text className="mb-0.5 text-center text-[12px] font-extrabold tracking-wider text-neutral-400 uppercase">
              Nghĩa tiếng Việt
            </Text>
            {meaningTiles.map((tile) => {
              const isMatched = matchedPairIds.has(tile.pairId);
              const isSelected = selectedMeaningId === tile.pairId;
              const isFailed = failedPairPairIds.has(tile.pairId) && isSelected;

              let cardBg = 'bg-white border-neutral-200 border-b-[4px]';
              let textClass = 'text-neutral-700';

              if (isMatched) {
                cardBg = 'bg-success-50 border-success-400 border-b-[2px]';
                textClass = 'text-success-800 line-through';
              }
              else if (isFailed) {
                cardBg = 'bg-error-50 border-error-500 border-b-[4px]';
                textClass = 'text-error-700';
              }
              else if (isSelected) {
                cardBg = 'bg-primary-50 border-primary-500 border-b-[4px]';
                textClass = 'text-primary-800 font-bold';
              }

              return (
                <TouchableOpacity
                  key={tile.id}
                  onPress={() => handleMeaningTap(tile)}
                  disabled={isMatched}
                  activeOpacity={0.8}
                  style={isMatched ? { opacity: 0.4 } : isSelected ? { transform: [{ scale: 1.02 }] } : undefined}
                  className={cn(
                    'min-h-[78px] justify-center rounded-2xl border-2 p-3',
                    cardBg,
                  )}
                >
                  <View className="flex-row items-center justify-between">
                    <Text className={cn('flex-1 pr-1 font-inter text-[14px] leading-snug font-bold', textClass)}>
                      {tile.text}
                    </Text>
                    {isMatched
                      ? (
                          <CheckCircleIcon size={18} className="shrink-0 text-success-500" />
                        )
                      : isFailed
                        ? (
                            <XCircleIcon size={18} className="shrink-0 text-error-500" />
                          )
                        : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </RNAnimated.View>
      </ScrollView>

      {/* 4. BOTTOM INFO FOOTER */}
      <View className="flex-row items-center justify-between border-t border-neutral-100 bg-white px-5 py-3.5">
        <View className="flex-row items-center gap-2">
          <View className="size-2.5 animate-pulse rounded-full bg-success-500" />
          <Text className="font-inter text-[12px] font-bold text-neutral-500">
            Đã ghép:
            {' '}
            <Text className="font-extrabold text-mascot-navy">{matchedPairIds.size}</Text>
            {' '}
            /
            {' '}
            {allPairs.length}
            {' '}
            cặp
          </Text>
        </View>

        {wrongAnswers.length > 0
          ? (
              <View className="rounded-lg border border-error-200 bg-error-50 px-2 py-0.5">
                <Text className="font-inter text-[11px] font-bold text-error-600">
                  Sai:
                  {' '}
                  {wrongAnswers.length}
                  {' '}
                  lần
                </Text>
              </View>
            )
          : (
              <View className="rounded-lg border border-success-200 bg-success-50 px-2 py-0.5">
                <Text className="font-inter text-[11px] font-bold text-success-700">
                  100% Chính xác ✨
                </Text>
              </View>
            )}
      </View>

      {/* 5. EXIT MODAL */}
      <Modal
        visible={showExitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExitModal(false)}
      >
        <View
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
          className="flex-1 items-center justify-center p-6"
        >
          <View className="w-full max-w-sm items-center rounded-3xl bg-white p-6">
            <Snapy pose="suy_nghi" animation="idle" style={{ width: 100, height: 100 }} className="mb-3" />

            <Text className="mb-1.5 text-center font-nunito text-[20px] font-extrabold text-mascot-navy">
              Bạn muốn dừng ghép đôi?
            </Text>
            <Text className="mb-6 px-2 text-center font-inter text-[14px] font-medium text-neutral-500">
              Tiến độ và số cặp đã ghép trong lượt này sẽ không được tính.
            </Text>

            <View className="w-full gap-3">
              <Pressable
                onPress={() => setShowExitModal(false)}
                className="h-12 w-full items-center justify-center rounded-xl border-b-[3px] border-primary-700 bg-primary-500"
              >
                <Text className="font-nunito text-[15px] font-extrabold text-white uppercase">TIẾP TỤC CHƠI</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setShowExitModal(false);
                  onExit();
                }}
                className="h-12 w-full flex-row items-center justify-center gap-2 rounded-xl border-b-[3px] border-neutral-300 bg-neutral-100"
              >
                <LogOutIcon size={16} className="text-neutral-500" />
                <Text className="font-nunito text-[14px] font-bold text-neutral-600 uppercase">THOÁT RA NGOÀI</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

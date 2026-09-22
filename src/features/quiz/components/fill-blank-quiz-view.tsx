/* eslint-disable max-lines-per-function */
import type { SnapyPose } from '@/components/ui/snapy';
import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
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
  HelpCircleIcon,
  LogOutIcon,
  SparklesIcon,
  VolumeIcon,
  XCircleIcon,
} from '@/components/ui/icons';
import { Snapy } from '@/components/ui/snapy';
import { cn } from '@/lib/utils';

// ==========================================
// TYPES & QUESTION POOL (20 ITEMS)
// ==========================================
export type FillBlankQuestion = {
  id: string;
  word: string;
  ipa: string;
  beforeBlank: string;
  afterBlank: string;
  fullSentence: string;
  vietnamese: string;
  hint: string;
  options: string[];
};

export type FillBlankResult = {
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

const FILL_BLANK_POOL: FillBlankQuestion[] = [
  {
    id: 'fb1',
    word: 'abandon',
    ipa: '/əˈbændən/',
    beforeBlank: 'They had to',
    afterBlank: 'the car in the heavy snow.',
    fullSentence: 'They had to abandon the car in the heavy snow.',
    vietnamese: 'Họ đã phải từ bỏ chiếc xe trong tuyết dày đặc.',
    hint: 'Động từ: từ bỏ, ruồng bỏ',
    options: ['abandon', 'achieve', 'improve', 'departure'],
  },
  {
    id: 'fb2',
    word: 'achieve',
    ipa: '/əˈtʃiːv/',
    beforeBlank: 'She worked tirelessly to',
    afterBlank: 'her dream of becoming a pilot.',
    fullSentence: 'She worked tirelessly to achieve her dream of becoming a pilot.',
    vietnamese: 'Cô ấy làm việc không biết mệt mỏi để đạt được ước mơ làm phi công.',
    hint: 'Động từ: đạt được, hoàn thành',
    options: ['achieve', 'abandon', 'delay', 'customs'],
  },
  {
    id: 'fb3',
    word: 'boarding pass',
    ipa: '/ˈbɔːrdɪŋ pæs/',
    beforeBlank: 'Please show your',
    afterBlank: 'before entering the airplane.',
    fullSentence: 'Please show your boarding pass before entering the airplane.',
    vietnamese: 'Vui lòng xuất trình thẻ lên máy bay trước khi vào máy bay.',
    hint: 'Danh từ: thẻ lên máy bay',
    options: ['boarding pass', 'luggage', 'passport', 'passenger'],
  },
  {
    id: 'fb4',
    word: 'departure',
    ipa: '/dɪˈpɑːrtʃər/',
    beforeBlank: 'The flight',
    afterBlank: 'was delayed due to a thunderstorm.',
    fullSentence: 'The flight departure was delayed due to a thunderstorm.',
    vietnamese: 'Giờ khởi hành của chuyến bay đã bị hoãn do cơn dông.',
    hint: 'Danh từ: sự khởi hành, cất cánh',
    options: ['departure', 'destination', 'itinerary', 'reservation'],
  },
  {
    id: 'fb5',
    word: 'destination',
    ipa: '/ˌdestɪˈneɪʃn/',
    beforeBlank: 'Tokyo is our final',
    afterBlank: 'on this summer trip.',
    fullSentence: 'Tokyo is our final destination on this summer trip.',
    vietnamese: 'Tokyo là điểm đến cuối cùng của chúng tôi trong chuyến đi mùa hè này.',
    hint: 'Danh từ: điểm đến, đích đến',
    options: ['destination', 'departure', 'terminal', 'luggage'],
  },
  {
    id: 'fb6',
    word: 'improve',
    ipa: '/ɪmˈpruːv/',
    beforeBlank: 'Daily practice will quickly',
    afterBlank: 'your speaking skills.',
    fullSentence: 'Daily practice will quickly improve your speaking skills.',
    vietnamese: 'Luyện tập mỗi ngày sẽ nhanh chóng cải thiện kỹ năng nói của bạn.',
    hint: 'Động từ: cải thiện, nâng cao',
    options: ['improve', 'abandon', 'achieve', 'delay'],
  },
  {
    id: 'fb7',
    word: 'luggage',
    ipa: '/ˈlʌɡɪdʒ/',
    beforeBlank: 'Do not leave your',
    afterBlank: 'unattended in the airport lobby.',
    fullSentence: 'Do not leave your luggage unattended in the airport lobby.',
    vietnamese: 'Đừng để hành lý của bạn không có người trông coi ở sảnh sân bay.',
    hint: 'Danh từ: hành lý, vali xách tay',
    options: ['luggage', 'customs', 'boarding pass', 'terminal'],
  },
  {
    id: 'fb8',
    word: 'efficient',
    ipa: '/ɪˈfɪʃnt/',
    beforeBlank: 'High-speed trains are a fast and',
    afterBlank: 'way to travel.',
    fullSentence: 'High-speed trains are a fast and efficient way to travel.',
    vietnamese: 'Tàu cao tốc là một phương thức di chuyển nhanh chóng và hiệu quả.',
    hint: 'Tính từ: hiệu quả, năng suất cao',
    options: ['efficient', 'accurate', 'delayed', 'passenger'],
  },
  {
    id: 'fb9',
    word: 'passenger',
    ipa: '/ˈpæsɪndʒər/',
    beforeBlank: 'Every',
    afterBlank: 'must fasten their seatbelt before takeoff.',
    fullSentence: 'Every passenger must fasten their seatbelt before takeoff.',
    vietnamese: 'Mỗi hành khách phải thắt dây an toàn trước khi cất cánh.',
    hint: 'Danh từ: hành khách',
    options: ['passenger', 'flight attendant', 'pilot', 'customs'],
  },
  {
    id: 'fb10',
    word: 'reservation',
    ipa: '/ˌrezərˈveɪʃn/',
    beforeBlank: 'I called the restaurant to confirm our dinner',
    afterBlank: 'for tonight.',
    fullSentence: 'I called the restaurant to confirm our dinner reservation for tonight.',
    vietnamese: 'Tôi đã gọi đến nhà hàng để xác nhận việc đặt chỗ tối nay.',
    hint: 'Danh từ: sự đặt chỗ trước',
    options: ['reservation', 'presentation', 'contract', 'itinerary'],
  },
  {
    id: 'fb11',
    word: 'itinerary',
    ipa: '/aɪˈtɪnəreri/',
    beforeBlank: 'The tour guide distributed the detailed travel',
    afterBlank: 'to everyone.',
    fullSentence: 'The tour guide distributed the detailed travel itinerary to everyone.',
    vietnamese: 'Hướng dẫn viên du lịch đã phát lịch trình chi tiết cho mọi người.',
    hint: 'Danh từ: lịch trình chuyến đi',
    options: ['itinerary', 'destination', 'terminal', 'luggage'],
  },
  {
    id: 'fb12',
    word: 'delay',
    ipa: '/dɪˈleɪ/',
    beforeBlank: 'We apologize for the unexpected flight',
    afterBlank: 'caused by fog.',
    fullSentence: 'We apologize for the unexpected flight delay caused by fog.',
    vietnamese: 'Chúng tôi xin lỗi vì sự trì hoãn chuyến bay bất ngờ do sương mù.',
    hint: 'Danh từ: sự chậm trễ, hoãn lại',
    options: ['delay', 'departure', 'reservation', 'deadline'],
  },
  {
    id: 'fb13',
    word: 'terminal',
    ipa: '/ˈtɜːrmɪnl/',
    beforeBlank: 'Please proceed to international',
    afterBlank: 'two for boarding.',
    fullSentence: 'Please proceed to international terminal two for boarding.',
    vietnamese: 'Vui lòng di chuyển đến nhà ga quốc tế số 2 để lên máy bay.',
    hint: 'Danh từ: nhà ga sân bay',
    options: ['terminal', 'customs', 'destination', 'itinerary'],
  },
  {
    id: 'fb14',
    word: 'customs',
    ipa: '/ˈkʌstəmz/',
    beforeBlank: 'All international travelers must pass through airport',
    afterBlank: 'inspection.',
    fullSentence: 'All international travelers must pass through airport customs inspection.',
    vietnamese: 'Tất cả du khách quốc tế phải đi qua khu kiểm tra hải quan sân bay.',
    hint: 'Danh từ: cơ quan hải quan',
    options: ['customs', 'terminal', 'luggage', 'passenger'],
  },
  {
    id: 'fb15',
    word: 'flight attendant',
    ipa: '/ˈflaɪt əˌtendənt/',
    beforeBlank: 'The helpful',
    afterBlank: 'served drinks and snacks during the flight.',
    fullSentence: 'The helpful flight attendant served drinks and snacks during the flight.',
    vietnamese: 'Tiếp viên hàng không nhiệt tình đã phục vụ đồ uống và đồ ăn nhẹ.',
    hint: 'Danh từ: tiếp viên hàng không',
    options: ['flight attendant', 'passenger', 'colleague', 'customs'],
  },
  {
    id: 'fb16',
    word: 'negotiate',
    ipa: '/nɪˈɡoʊʃieɪt/',
    beforeBlank: 'Both companies will meet tomorrow to',
    afterBlank: 'the terms.',
    fullSentence: 'Both companies will meet tomorrow to negotiate the terms.',
    vietnamese: 'Cả hai công ty sẽ gặp nhau vào ngày mai để đàm phán các điều khoản.',
    hint: 'Động từ: đàm phán, thương lượng',
    options: ['negotiate', 'improve', 'achieve', 'abandon'],
  },
  {
    id: 'fb17',
    word: 'contract',
    ipa: '/ˈkɑːntrækt/',
    beforeBlank: 'Please review and sign the business',
    afterBlank: 'carefully.',
    fullSentence: 'Please review and sign the business contract carefully.',
    vietnamese: 'Vui lòng xem lại và ký hợp đồng kinh doanh một cách cẩn thận.',
    hint: 'Danh từ: bản hợp đồng',
    options: ['contract', 'reservation', 'deadline', 'itinerary'],
  },
  {
    id: 'fb18',
    word: 'colleague',
    ipa: '/ˈkɑːliːɡ/',
    beforeBlank: 'I received valuable advice from my senior',
    afterBlank: 'at work.',
    fullSentence: 'I received valuable advice from my senior colleague at work.',
    vietnamese: 'Tôi đã nhận được lời khuyên quý giá từ người đồng nghiệp cấp cao.',
    hint: 'Danh từ: đồng nghiệp',
    options: ['colleague', 'passenger', 'flight attendant', 'customs'],
  },
  {
    id: 'fb19',
    word: 'deadline',
    ipa: '/ˈdedlaɪn/',
    beforeBlank: 'We must work overtime to meet the project',
    afterBlank: 'on Friday.',
    fullSentence: 'We must work overtime to meet the project deadline on Friday.',
    vietnamese: 'Chúng ta phải làm thêm giờ để kịp hạn chót dự án vào thứ Sáu.',
    hint: 'Danh từ: hạn chót hoàn thành',
    options: ['deadline', 'delay', 'terminal', 'contract'],
  },
  {
    id: 'fb20',
    word: 'presentation',
    ipa: '/ˌpriːzenˈteɪʃn/',
    beforeBlank: 'The marketing manager gave an inspiring',
    afterBlank: 'to the board.',
    fullSentence: 'The marketing manager gave an inspiring presentation to the board.',
    vietnamese: 'Trưởng phòng tiếp thị đã có bài thuyết trình truyền cảm hứng.',
    hint: 'Danh từ: bài thuyết trình',
    options: ['presentation', 'reservation', 'itinerary', 'destination'],
  },
];

// Web Audio synthesizer
function playSuccessSound() {
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
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880, now + 0.1); // A5
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }
  catch {}
}

function playErrorSound() {
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
  catch {}
}

// Pronunciation with SpeechSynthesis
function speakSentence(sentence: string) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.lang = 'en-US';
    utterance.rate = 0.88;
    window.speechSynthesis.speak(utterance);
  }
}

export type FillBlankQuizViewProps = {
  quizId?: number;
  count?: number;
  reviewWrong?: boolean;
  wrongData?: string;
  onExit: () => void;
  onComplete: (result: FillBlankResult) => void;
  isCompleting?: boolean;
};

export function FillBlankQuizView({
  count = 5,
  reviewWrong = false,
  wrongData,
  onExit,
  onComplete,
}: FillBlankQuizViewProps) {
  const { width } = Dimensions.get('window');

  // 1. Prepare questions
  const questions = useMemo<FillBlankQuestion[]>(() => {
    if (reviewWrong && wrongData) {
      try {
        const parsed = JSON.parse(wrongData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any, idx: number) => {
            const found = FILL_BLANK_POOL.find(p => p.word.toLowerCase() === item.word?.toLowerCase());
            if (found)
              return found;
            return {
              id: `rw_${idx}`,
              word: item.word,
              ipa: item.ipa || '/.../',
              beforeBlank: 'Fill the word:',
              afterBlank: 'in this sentence.',
              fullSentence: `Fill the word ${item.word} in this sentence.`,
              vietnamese: item.correct || 'Từ vựng cần ôn tập',
              hint: `Đáp án: ${item.word}`,
              options: [item.word, 'abandon', 'improve', 'achieve'].sort(() => Math.random() - 0.5),
            };
          });
        }
      }
      catch {}
    }
    const targetCount = Math.max(1, count);
    const result: FillBlankQuestion[] = [];
    for (let i = 0; i < targetCount; i++) {
      const base = FILL_BLANK_POOL[i % FILL_BLANK_POOL.length];
      result.push({
        ...base,
        id: `${base.id}_${i}`,
      });
    }
    return result;
  }, [count, reviewWrong, wrongData]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputText, setInputText] = useState('');
  const [checkState, setCheckState] = useState<'IDLE' | 'CORRECT' | 'INCORRECT'>('IDLE');
  const [showHint, setShowHint] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

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

  // Performance tracking
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<Array<{
    id: string;
    word: string;
    ipa?: string;
    correct: string;
    yours: string;
  }>>([]);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  // Mascot state
  const [mascotPose, setMascotPose] = useState<SnapyPose>('tap_trung');
  const [mascotAnim, setMascotAnim] = useState<string>('idle');
  const [bubbleText, setBubbleText] = useState('Chọn hoặc gõ từ thích hợp vào chỗ trống!');

  // Animation references
  const slideAnim = useRef(new RNAnimated.Value(0)).current;
  const shakeAnim = useRef(new RNAnimated.Value(0)).current;
  const bottomBarAnim = useRef(new RNAnimated.Value(0)).current;

  const currentQ = questions[currentIndex] || questions[0];

  // Shuffled options for current question
  const shuffledOptions = useMemo(() => {
    return [...currentQ.options].sort(() => Math.random() - 0.5);
  }, [currentQ]);

  // Handle word chip tap
  const handleChipTap = (chipWord: string) => {
    if (checkState !== 'IDLE')
      return;

    if (inputText.trim().toLowerCase() === chipWord.toLowerCase()) {
      // Deselect chip
      setInputText('');
    }
    else {
      setInputText(chipWord);
    }
  };

  // Play sentence audio
  const handlePlayAudio = () => {
    setIsSpeaking(true);
    speakSentence(currentQ.fullSentence);
    setTimeout(() => setIsSpeaking(false), 2000);
  };

  // Check Answer
  const handleCheck = () => {
    if (!inputText.trim() || checkState !== 'IDLE')
      return;

    const isCorrect = inputText.trim().toLowerCase() === currentQ.word.toLowerCase();

    if (isCorrect) {
      playSuccessSound();
      setCheckState('CORRECT');
      setMascotPose('an_mung');
      setMascotAnim('celebrate');
      setBubbleText('Xuất sắc! Bạn đã điền chính xác! 🎉');
      setScore(s => s + 1);

      // Auto pronounce full sentence on correct
      speakSentence(currentQ.fullSentence);
    }
    else {
      playErrorSound();
      setCheckState('INCORRECT');
      setMascotPose('bat_ngo');
      setMascotAnim('shake');
      setBubbleText('Chưa chính xác rồi! Cùng xem đáp án nhé! 🤔');

      // Record mistake
      setWrongAnswers(prev => [
        ...prev,
        {
          id: currentQ.id,
          word: currentQ.word,
          ipa: currentQ.ipa,
          correct: currentQ.word,
          yours: inputText.trim(),
        },
      ]);

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
  };

  // Advance to next question or complete
  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      const finalScore = score;
      const totalCount = questions.length;
      const xpEarned = finalScore * 10;
      const coinEarned = finalScore * 5;

      onComplete({
        score: finalScore,
        total: totalCount,
        xp: xpEarned,
        coin: coinEarned,
        time: formatTimer(elapsedSeconds),
        wrongAnswers,
      });
      return;
    }

    // Slide transition
    RNAnimated.timing(slideAnim, {
      toValue: -width,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setCurrentIndex(prev => prev + 1);
      setInputText('');
      setCheckState('IDLE');
      setShowHint(false);
      setMascotPose('tap_trung');
      setMascotAnim('idle');
      setBubbleText('Chọn hoặc gõ từ thích hợp vào chỗ trống!');
      bottomBarAnim.setValue(0);

      slideAnim.setValue(width);
      RNAnimated.timing(slideAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    });
  };

  const progressPercent = ((currentIndex) / questions.length) * 100;
  const isFilled = inputText.trim().length > 0;

  const translateY = bottomBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [120, 0],
  });

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
              style={{ width: `${checkState === 'IDLE' ? progressPercent : ((currentIndex + 1) / questions.length) * 100}%` }}
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

        {/* Question Counter */}
        <Text className="text-right font-nunito text-[15px] font-extrabold text-neutral-600 tabular-nums">
          {currentIndex + 1}
          /
          {questions.length}
        </Text>
      </View>

      {/* 2. PLAYGROUND CONTENT */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <RNAnimated.View
          style={{
            transform: [{ translateX: slideAnim }],
            flex: 1,
          }}
        >
          {/* MASCOT CHOREOGRAPHY & BUBBLE */}
          <View className="my-2 flex-row items-center justify-center gap-3">
            <View style={{ width: 85, height: 85 }} className="items-center justify-center">
              <Snapy pose={mascotPose} animation={mascotAnim} style={{ width: 85, height: 85 }} />
            </View>
            <View className="flex-1 rounded-2xl border border-neutral-200 bg-white px-3.5 py-2.5">
              <View className="mb-0.5 flex-row items-center gap-1.5">
                <SparklesIcon size={13} className="text-warning-500" />
                <Text className="font-nunito text-[12px] font-extrabold text-mascot-navy">Snapy</Text>
              </View>
              <Text className="font-inter text-[13px] leading-snug font-medium text-neutral-600">
                {bubbleText}
              </Text>
            </View>
          </View>

          {/* QUESTION CARD */}
          <RNAnimated.View
            style={{ transform: [{ translateX: shakeAnim }] }}
            className="mt-2 rounded-3xl border-2 border-b-[5px] border-neutral-200 bg-white p-5"
          >
            {/* Vietnamese Meaning Prompt */}
            <View className="mb-4 flex-row items-start justify-between">
              <View className="flex-1 pr-2">
                <Text className="mb-1 font-inter text-[12px] font-bold tracking-wider text-neutral-400 uppercase">
                  Dịch nghĩa câu
                </Text>
                <Text className="font-nunito text-[16px] leading-snug font-extrabold text-mascot-navy">
                  "
                  {currentQ.vietnamese}
                  "
                </Text>
              </View>

              <TouchableOpacity
                onPress={handlePlayAudio}
                activeOpacity={0.7}
                className={cn(
                  'size-10 shrink-0 items-center justify-center rounded-xl border',
                  isSpeaking ? 'border-primary-300 bg-primary-100' : 'border-info-200 bg-info-50',
                )}
              >
                <VolumeIcon size={20} className={isSpeaking ? 'text-primary-600' : 'text-info-600'} />
              </TouchableOpacity>
            </View>

            {/* SENTENCE WITH INTERACTIVE BLANK */}
            <View className="mb-3 flex-row flex-wrap items-center gap-2 rounded-2xl border border-neutral-200 bg-[#F7F8FA] p-4">
              <Text className="font-nunito text-[18px] font-extrabold text-mascot-navy">
                {currentQ.beforeBlank}
              </Text>

              {/* THE BLANK INPUT BOX */}
              <View className={cn(
                'min-w-[120px] flex-row items-center justify-center rounded-xl border-2 px-3 py-1.5',
                checkState === 'CORRECT'
                  ? 'border-success-500 bg-success-100'
                  : checkState === 'INCORRECT'
                    ? 'border-error-500 bg-error-50'
                    : isFilled
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-dashed border-neutral-400 bg-white',
              )}
              >
                <TextInput
                  value={inputText}
                  onChangeText={(txt) => {
                    if (checkState === 'IDLE')
                      setInputText(txt);
                  }}
                  editable={checkState === 'IDLE'}
                  placeholder="điền từ..."
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className={cn(
                    'text-center font-nunito text-[18px] font-extrabold',
                    checkState === 'CORRECT'
                      ? 'text-success-800'
                      : checkState === 'INCORRECT'
                        ? 'text-error-700'
                        : 'text-primary-700',
                  )}
                />
              </View>

              <Text className="font-nunito text-[18px] font-extrabold text-mascot-navy">
                {currentQ.afterBlank}
              </Text>
            </View>

            {/* HINT TOGGLE */}
            <View className="flex-row items-center justify-between pt-1">
              <TouchableOpacity
                onPress={() => setShowHint(!showHint)}
                className="flex-row items-center gap-1.5 py-1"
              >
                <HelpCircleIcon size={16} className="text-warning-600" />
                <Text className="font-inter text-[13px] font-bold text-warning-700">
                  {showHint ? 'Ẩn gợi ý' : 'Xem gợi ý từ loại'}
                </Text>
              </TouchableOpacity>
            </View>

            {showHint && (
              <View className="mt-2.5 rounded-xl border border-warning-200 bg-warning-50 p-2.5">
                <Text className="font-inter text-[13px] font-medium text-warning-800">
                  💡
                  {' '}
                  {currentQ.hint}
                </Text>
              </View>
            )}
          </RNAnimated.View>

          {/* 3. WORD BANK (DUOLINGO STYLE WORD CHIPS) */}
          <View className="mt-6">
            <Text className="mb-3 text-center font-inter text-[13px] font-extrabold tracking-wider text-neutral-400 uppercase">
              Ngân hàng từ vựng gợi ý (Chạm để điền)
            </Text>

            <View className="flex-row flex-wrap justify-center gap-2.5">
              {shuffledOptions.map((opt) => {
                const isSelected = inputText.trim().toLowerCase() === opt.toLowerCase();
                const isSubmitted = checkState !== 'IDLE';

                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => handleChipTap(opt)}
                    disabled={isSubmitted}
                    activeOpacity={0.8}
                    style={isSelected ? { transform: [{ translateY: -2 }] } : undefined}
                    className={cn(
                      'rounded-2xl border-2 px-4 py-3',
                      isSelected
                        ? 'border-b-4 border-primary-700 bg-primary-500'
                        : 'border-b-4 border-neutral-200 bg-white',
                    )}
                  >
                    <Text className={cn(
                      'font-nunito text-[16px] font-extrabold',
                      isSelected ? 'text-white' : 'text-mascot-navy',
                    )}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </RNAnimated.View>
      </ScrollView>

      {/* 4. BOTTOM ACTION & FEEDBACK DRAWER */}
      {checkState === 'IDLE'
        ? (
            <View className="border-t border-neutral-200 bg-white p-5">
              <TouchableOpacity
                onPress={handleCheck}
                disabled={!isFilled}
                activeOpacity={0.85}
                style={!isFilled ? { opacity: 0.8 } : undefined}
                className={cn(
                  'h-14 w-full items-center justify-center rounded-2xl',
                  isFilled
                    ? 'border-b-4 border-primary-700 bg-primary-500'
                    : 'border-b-4 border-neutral-300 bg-neutral-200',
                )}
              >
                <Text className={cn(
                  'font-nunito text-[16px] font-extrabold tracking-wider uppercase',
                  isFilled ? 'text-white' : 'text-neutral-400',
                )}
                >
                  KIỂM TRA
                </Text>
              </TouchableOpacity>
            </View>
          )
        : (
            <RNAnimated.View style={{ transform: [{ translateY }] }}>
              <View className={cn(
                'border-t-2 p-5',
                checkState === 'CORRECT' ? 'border-success-200 bg-success-50' : 'border-error-200 bg-error-50',
              )}
              >
                <View className="mb-4 flex-row items-start justify-between">
                  <View className="flex-1 flex-row items-center gap-3 pr-2">
                    <View className={cn(
                      'size-11 items-center justify-center rounded-2xl border',
                      checkState === 'CORRECT' ? 'border-success-200 bg-white' : 'border-error-200 bg-white',
                    )}
                    >
                      {checkState === 'CORRECT'
                        ? (
                            <CheckCircleIcon size={26} className="text-success-500" />
                          )
                        : (
                            <XCircleIcon size={26} className="text-error-500" />
                          )}
                    </View>
                    <View className="flex-1">
                      <Text className={cn(
                        'font-nunito text-[19px] font-extrabold',
                        checkState === 'CORRECT' ? 'text-success-700' : 'text-error-700',
                      )}
                      >
                        {checkState === 'CORRECT' ? 'Chính xác! Rất giỏi! 🎯' : 'Chưa chính xác!'}
                      </Text>
                      {checkState === 'INCORRECT' && (
                        <Text className="mt-0.5 font-inter text-[14px] font-bold text-error-600">
                          Từ đúng:
                          {' '}
                          <Text className="font-extrabold text-error-800">{currentQ.word}</Text>
                        </Text>
                      )}
                    </View>
                  </View>
                  {checkState === 'CORRECT' && (
                    <View className="rounded-xl border border-warning-300 bg-warning-100 px-2.5 py-1">
                      <Text className="font-nunito text-[14px] font-extrabold text-warning-700">+10 XP</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  onPress={handleNext}
                  activeOpacity={0.85}
                  className={cn(
                    'h-14 w-full flex-row items-center justify-center gap-2 rounded-2xl border-b-4',
                    checkState === 'CORRECT'
                      ? 'border-success-700 bg-success-500'
                      : 'border-error-700 bg-error-500',
                  )}
                >
                  <Text className="font-nunito text-[16px] font-extrabold tracking-wider text-white uppercase">
                    {currentIndex + 1 >= questions.length ? 'XEM KẾT QUẢ' : 'TIẾP TỤC'}
                  </Text>
                  <ArrowRightIcon size={20} className="text-white" />
                </TouchableOpacity>
              </View>
            </RNAnimated.View>
          )}

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
          <View className="w-full max-w-sm items-center rounded-3xl border border-neutral-200 bg-white p-6">
            <Snapy pose="suy_nghi" animation="idle" style={{ width: 100, height: 100 }} className="mb-3" />

            <Text className="mb-1.5 text-center font-nunito text-[20px] font-extrabold text-mascot-navy">
              Bạn muốn dừng bài Quiz?
            </Text>
            <Text className="mb-6 px-2 text-center font-inter text-[14px] font-medium text-neutral-500">
              Tiến độ làm bài và điểm số trong lượt này sẽ không được lưu.
            </Text>

            <View className="w-full gap-3">
              <Pressable
                onPress={() => setShowExitModal(false)}
                className="h-12 w-full items-center justify-center rounded-xl border-b-[3px] border-primary-700 bg-primary-500"
              >
                <Text className="font-nunito text-[15px] font-extrabold text-white uppercase">TIẾP TỤC LÀM BÀI</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setShowExitModal(false);
                  onExit();
                }}
                className="h-12 w-full flex-row items-center justify-center gap-2 rounded-xl border-b-[3px] border-neutral-300 bg-neutral-100"
              >
                <LogOutIcon size={16} className="text-neutral-500" />
                <Text className="font-nunito text-[14px] font-bold text-neutral-600 uppercase">THOÁT QUIZ</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

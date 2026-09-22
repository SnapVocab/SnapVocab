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

// ==========================================
// TYPES & QUESTION BANK (20 VOCABULARY ITEMS)
// ==========================================
type CheckState = 'IDLE' | 'CORRECT' | 'INCORRECT';

export type QuestionItem = {
  id: string;
  word: string;
  ipa: string;
  meaningVi: string;
  promptText: string;
  promptSubtext: string;
  correctText: string;
  correctId: string;
  options: { id: string; text: string }[];
};

export const BASE_VOCABULARY = [
  { id: 'v1', word: 'abandon', ipa: '/əˈbændən/', meaning: 'Từ bỏ, ruồng bỏ', distractorVi: ['Cải thiện, phát triển', 'Đạt được thành tích', 'Trì hoãn, hoãn lại'], distractorEn: ['improve', 'achieve', 'delay'] },
  { id: 'v2', word: 'achieve', ipa: '/əˈtʃiːv/', meaning: 'Đạt được, hoàn thành', distractorVi: ['Bảo vệ, gìn giữ', 'Phát hiện ra', 'Thất bại hoàn toàn'], distractorEn: ['protect', 'discover', 'abandon'] },
  { id: 'v3', word: 'boarding pass', ipa: '/ˈbɔːrdɪŋ pæs/', meaning: 'Thẻ lên máy bay', distractorVi: ['Hộ chiếu xuất cảnh', 'Hóa đơn hành lý', 'Thẻ căn cước công dân'], distractorEn: ['passport', 'invoice', 'luggage'] },
  { id: 'v4', word: 'departure', ipa: '/dɪˈpɑːrtʃər/', meaning: 'Sự khởi hành, xuất phát', distractorVi: ['Sự chậm trễ', 'Nơi hạ cánh', 'Sự hoãn lại'], distractorEn: ['destination', 'delay', 'arrival'] },
  { id: 'v5', word: 'destination', ipa: '/ˌdestɪˈneɪʃn/', meaning: 'Điểm đến, đích đến', distractorVi: ['Khoảng cách hành trình', 'Phương tiện vận chuyển', 'Thời gian bay'], distractorEn: ['departure', 'vehicle', 'schedule'] },
  { id: 'v6', word: 'improve', ipa: '/ɪmˈpruːv/', meaning: 'Cải thiện, nâng cao', distractorVi: ['Từ bỏ cơ hội', 'Gặp gỡ trao đổi', 'Ghi chép cẩn thận'], distractorEn: ['abandon', 'meet', 'record'] },
  { id: 'v7', word: 'luggage', ipa: '/ˈlʌɡɪdʒ/', meaning: 'Hành lý, đồ đạc xách tay', distractorVi: ['Ghế ngồi thương gia', 'Cửa ra máy bay', 'Phiếu thanh toán'], distractorEn: ['terminal', 'boarding pass', 'receipt'] },
  { id: 'v8', word: 'efficient', ipa: '/ɪˈfɪʃnt/', meaning: 'Hiệu quả, năng suất cao', distractorVi: ['Tốn kém, lãng phí', 'Khó khăn, phức tạp', 'Chậm chạp, trì trệ'], distractorEn: ['wasteful', 'difficult', 'slow'] },
  { id: 'v9', word: 'passenger', ipa: '/ˈpæsɪndʒər/', meaning: 'Hành khách trên chuyến đi', distractorVi: ['Phi công điều khiển', 'Nhân viên an ninh', 'Người hướng dẫn'], distractorEn: ['pilot', 'security', 'guide'] },
  { id: 'v10', word: 'reservation', ipa: '/ˌrezərˈveɪʃn/', meaning: 'Sự đặt chỗ, giữ chỗ trước', distractorVi: ['Sự hủy chuyến', 'Hóa đơn tiền phòng', 'Hợp đồng lao động'], distractorEn: ['cancellation', 'invoice', 'contract'] },
  { id: 'v11', word: 'itinerary', ipa: '/aɪˈtɪnəreri/', meaning: 'Lịch trình, kế hoạch chuyến đi', distractorVi: ['Bản đồ du lịch', 'Chi phí phát sinh', 'Phương tiện công cộng'], distractorEn: ['map', 'expense', 'transit'] },
  { id: 'v12', word: 'delay', ipa: '/dɪˈleɪ/', meaning: 'Sự trì hoãn, làm chậm trễ', distractorVi: ['Sự khẩn cấp', 'Khởi hành sớm', 'Tăng tốc di chuyển'], distractorEn: ['urgent', 'departure', 'speed'] },
  { id: 'v13', word: 'terminal', ipa: '/ˈtɜːrmɪnl/', meaning: 'Nhà ga sân bay, bến bãi', distractorVi: ['Đường băng cất cánh', 'Tháp không lưu', 'Quầy làm thủ tục'], distractorEn: ['runway', 'control tower', 'desk'] },
  { id: 'v14', word: 'customs', ipa: '/ˈkʌstəmz/', meaning: 'Cơ quan hải quan, thuế quan', distractorVi: ['Đồn công an biên giới', 'Khu vực cách ly y tế', 'Quầy đổi ngoại tệ'], distractorEn: ['police', 'quarantine', 'exchange'] },
  { id: 'v15', word: 'flight attendant', ipa: '/ˈflaɪt əˌtendənt/', meaning: 'Tiếp viên hàng không', distractorVi: ['Nhân viên bốc dỡ', 'Nhân viên bán vé', 'Kỹ thuật viên tàu bay'], distractorEn: ['loader', 'agent', 'mechanic'] },
  { id: 'v16', word: 'negotiate', ipa: '/nɪˈɡoʊʃieɪt/', meaning: 'Đàm phán, thương lượng', distractorVi: ['Chấp thuận ngay', 'Từ chối thẳng thừng', 'Ký kết hoàn tất'], distractorEn: ['accept', 'refuse', 'sign'] },
  { id: 'v17', word: 'contract', ipa: '/ˈkɑːntrækt/', meaning: 'Bản hợp đồng giao dịch', distractorVi: ['Báo cáo tài chính', 'Biên bản cuộc họp', 'Lời hứa miệng'], distractorEn: ['report', 'minutes', 'promise'] },
  { id: 'v18', word: 'colleague', ipa: '/ˈkɑːliːɡ/', meaning: 'Đồng nghiệp cùng cơ quan', distractorVi: ['Khách hàng đối tác', 'Cấp trên trực tiếp', 'Đối thủ cạnh tranh'], distractorEn: ['client', 'boss', 'rival'] },
  { id: 'v19', word: 'deadline', ipa: '/ˈdedlaɪn/', meaning: 'Hạn chót hoàn thành công việc', distractorVi: ['Lịch hẹn gặp', 'Giờ mở cửa văn phòng', 'Thời gian bắt đầu'], distractorEn: ['appointment', 'opening', 'start'] },
  { id: 'v20', word: 'presentation', ipa: '/ˌpriːzenˈteɪʃn/', meaning: 'Bài thuyết trình, báo cáo', distractorVi: ['Cuộc phỏng vấn xin việc', 'Bản thảo bài viết', 'Tài liệu hướng dẫn'], distractorEn: ['interview', 'draft', 'manual'] },
];

export type MultipleChoiceResult = {
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
  wrongAnswers: Array<{
    id: string;
    word: string;
    ipa: string;
    correct: string;
    yours: string;
  }>;
};

export type MultipleChoiceQuizViewProps = {
  topicId?: string;
  topicName?: string;
  deckId?: string;
  count?: number;
  direction?: 'EN_VI' | 'VI_EN';
  reviewWrong?: boolean;
  wrongData?: string;
  onExit: () => void;
  onComplete: (result: MultipleChoiceResult) => void;
};

export function MultipleChoiceQuizView({
  topicId = 't1',
  topicName = 'Chủ đề từ vựng',
  deckId = 't1',
  count = 5,
  direction = 'EN_VI',
  reviewWrong = false,
  wrongData,
  onExit,
  onComplete,
}: MultipleChoiceQuizViewProps) {
  // 1. Determine questions list ensuring exact count
  const questions = useMemo<QuestionItem[]>(() => {
    if (reviewWrong && wrongData) {
      try {
        const parsed = JSON.parse(wrongData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any, idx: number) => {
            const isViEn = direction === 'VI_EN';
            return {
              id: `rw_${idx}`,
              word: item.word,
              ipa: item.ipa || '/.../',
              meaningVi: item.correct,
              promptText: isViEn ? (item.correct || item.meaningVi) : item.word,
              promptSubtext: isViEn ? '(Chọn từ tiếng Anh chính xác)' : (item.ipa || ''),
              correctText: isViEn ? item.word : item.correct,
              correctId: 'opt1',
              options: (isViEn
                ? [
                    { id: 'opt1', text: item.word },
                    { id: 'opt2', text: 'abandon' },
                    { id: 'opt3', text: 'improve' },
                    { id: 'opt4', text: 'achieve' },
                  ]
                : [
                    { id: 'opt1', text: item.correct },
                    { id: 'opt2', text: 'Từ bỏ, ruồng bỏ' },
                    { id: 'opt3', text: 'Cải thiện, phát triển' },
                    { id: 'opt4', text: 'Đạt được thành tích' },
                  ]).sort(() => Math.random() - 0.5),
            };
          });
        }
      }
      catch {
        // fallback to standard generation
      }
    }

    const isViEn = direction === 'VI_EN';
    const targetCount = Math.max(1, count);
    const generated: QuestionItem[] = [];

    for (let i = 0; i < targetCount; i++) {
      const vocab = BASE_VOCABULARY[i % BASE_VOCABULARY.length];
      const correctId = `opt_${i}_correct`;

      let optionsList: { id: string; text: string }[] = [];
      if (isViEn) {
        optionsList = [
          { id: correctId, text: vocab.word },
          { id: `opt_${i}_d1`, text: vocab.distractorEn[0] },
          { id: `opt_${i}_d2`, text: vocab.distractorEn[1] },
          { id: `opt_${i}_d3`, text: vocab.distractorEn[2] },
        ];
      }
      else {
        optionsList = [
          { id: correctId, text: vocab.meaning },
          { id: `opt_${i}_d1`, text: vocab.distractorVi[0] },
          { id: `opt_${i}_d2`, text: vocab.distractorVi[1] },
          { id: `opt_${i}_d3`, text: vocab.distractorVi[2] },
        ];
      }

      // Shuffle options
      optionsList.sort(() => Math.random() - 0.5);

      generated.push({
        id: `q_${i}_${vocab.id}`,
        word: vocab.word,
        ipa: vocab.ipa,
        meaningVi: vocab.meaning,
        promptText: isViEn ? vocab.meaning : vocab.word,
        promptSubtext: isViEn ? '(Chọn từ tiếng Anh tương ứng)' : vocab.ipa,
        correctText: isViEn ? vocab.word : vocab.meaning,
        correctId,
        options: optionsList,
      });
    }

    return generated;
  }, [count, direction, reviewWrong, wrongData]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [checkState, setCheckState] = useState<CheckState>('IDLE');
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

  // Score & Performance Tracking
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<Array<{
    id: string;
    word: string;
    ipa: string;
    correct: string;
    yours: string;
  }>>([]);
  const startTimeRef = useRef<number>(0);
  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

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
  }, []);

  const currentQ = questions[currentIndex] || questions[0];
  const progressPercent = ((currentIndex) / questions.length) * 100;

  const handleCheck = () => {
    if (!selectedOpt || checkState !== 'IDLE')
      return;

    const isCorrect = selectedOpt === currentQ.correctId;
    setCheckState(isCorrect ? 'CORRECT' : 'INCORRECT');
    setMascotPose(isCorrect ? 'nhay_len' : 'bat_ngo');
    setMascotAnim(isCorrect ? 'celebrate' : 'shake');

    if (isCorrect) {
      setScore(s => s + 1);
    }
    else {
      const chosen = currentQ.options.find(o => o.id === selectedOpt)?.text || '';
      setWrongAnswers(prev => [
        ...prev,
        {
          id: currentQ.id,
          word: currentQ.word,
          ipa: currentQ.ipa,
          correct: currentQ.correctText,
          yours: chosen,
        },
      ]);
    }

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
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      const elapsed = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
      const finalScore = score;
      const totalQuestions = questions.length;
      const xpEarned = finalScore * 10;
      const coinEarned = finalScore * 5;

      onComplete({
        score: finalScore,
        total: totalQuestions,
        xp: xpEarned,
        coin: coinEarned,
        time: formatTimer(elapsed),
        topicId,
        topicName,
        deckId,
        mode: 'MULTIPLE_CHOICE',
        direction,
        wrongAnswers,
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
      // Update state
      setCurrentIndex(prev => prev + 1);
      setSelectedOpt(null);
      setCheckState('IDLE');
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
                {direction === 'VI_EN' ? 'Chọn từ tiếng Anh phù hợp' : 'Chọn nghĩa tiếng Việt đúng'}
              </Text>
              <View className="rounded-md bg-neutral-100 px-2 py-0.5">
                <Text className="font-inter text-[10px] font-bold text-neutral-500">
                  {direction === 'VI_EN' ? '🇻🇳 ➔ 🇬🇧' : '🇬🇧 ➔ 🇻🇳'}
                </Text>
              </View>
            </View>

            <View className="mb-1.5 flex-row items-center justify-between rounded-2xl border-2 border-neutral-100 bg-white p-4">
              <View className="flex-1 pr-2">
                <Text className="font-nunito text-[28px] leading-tight font-extrabold text-mascot-navy">
                  {currentQ.promptText}
                </Text>
                <Text className="mt-0.5 font-inter text-[15px] font-medium text-neutral-400">
                  {currentQ.promptSubtext}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => playPronunciation(currentQ.word)}
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
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedOpt === opt.id;
              const isSubmitted = checkState !== 'IDLE';
              const isCorrectOption = opt.id === currentQ.correctId;

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
                  key={opt.id}
                  style={{
                    opacity: animVal,
                    transform: [{
                      translateY: animVal.interpolate({ inputRange: [0, 1], outputRange: [15, 0] }),
                    }],
                  }}
                >
                  <TouchableOpacity
                    onPress={() => !isSubmitted && setSelectedOpt(opt.id)}
                    disabled={isSubmitted}
                    activeOpacity={0.85}
                    className={cn(
                      'flex-row items-center rounded-2xl border-2 p-4',
                      containerStyle,
                    )}
                  >
                    <View className={cn(
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
                        <Text className="text-[12px] font-bold text-neutral-400">{String.fromCharCode(65 + idx)}</Text>
                      )}
                    </View>

                    <Text className={cn('flex-1 font-inter text-[15px] font-bold', textStyle)}>
                      {opt.text}
                    </Text>
                  </TouchableOpacity>
                </RNAnimated.View>
              );
            })}
          </View>

        </RNAnimated.View>
      </ScrollView>

      {/* 4. BOTTOM ACTION & FEEDBACK BAR */}
      <RNAnimated.View style={{ opacity: contentOpacity }}>
        {checkState === 'IDLE'
          ? (
              <View className="border-t border-neutral-200 bg-white p-5">
                <TouchableOpacity
                  onPress={handleCheck}
                  disabled={!selectedOpt}
                  activeOpacity={0.85}
                  style={!selectedOpt ? { opacity: 0.8 } : undefined}
                  className={cn(
                    'h-14 w-full items-center justify-center rounded-2xl',
                    selectedOpt
                      ? 'border-b-4 border-primary-700 bg-primary-500'
                      : 'border-b-4 border-neutral-300 bg-neutral-200',
                  )}
                >
                  <Text className={cn(
                    'font-nunito text-[16px] font-extrabold tracking-wider uppercase',
                    selectedOpt ? 'text-white' : 'text-neutral-400',
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
                          {checkState === 'CORRECT' ? 'Chính xác! Rất tuyệt! 🎯' : 'Chưa đúng rồi!'}
                        </Text>
                        {checkState === 'INCORRECT' && (
                          <Text className="mt-0.5 font-inter text-[13px] font-bold text-error-600">
                            Đáp án:
                            {' '}
                            <Text className="font-extrabold">{currentQ.correctText}</Text>
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
      </RNAnimated.View>

      {/* 5. MODAL XÁC NHẬN THOÁT AN TOÀN */}
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

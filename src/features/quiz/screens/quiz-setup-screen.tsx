/* eslint-disable max-lines-per-function */
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { QuizAvailableTopic } from '../api/quiz-api';
import type { CreateQuizRequest, QuizDirection, QuizHistorySummaryResponse, QuizMode } from '../types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ui';
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  EditIcon,
  LayersIcon,
  LayoutGridIcon,
  SparklesIcon,
} from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import {
  getQuizHistory,
  useCancelQuiz,
  useCreateQuiz,
  useQuizAvailableTopics,
} from '../api/quiz-api';
import { TopicSelectBottomSheet } from '../components/topic-select-bottom-sheet';
import { findResumableQuiz } from '../utils';
import { generateIdempotencyKey } from '../utils/idempotency';

// ==========================================
// CONFIGURATION CONSTANTS
// ==========================================

export const QUIZ_MODES = [
  {
    id: 'MCQ' as QuizMode,
    label: 'Trắc nghiệm phản xạ',
    desc: 'Chọn nhanh đáp án đúng trong 4 lựa chọn',
    badge: 'Khuyên dùng',
    icon: LayoutGridIcon,
    available: true,
  },
  {
    id: 'MATCHING' as QuizMode,
    label: 'Ghép đôi từ vựng',
    desc: 'Nối các cặp từ tiếng Anh với nghĩa tiếng Việt. Điểm tính theo lần ghép đầu tiên.',
    badge: 'Phổ biến',
    icon: LayersIcon,
    available: true,
  },
  {
    id: 'FILL_BLANK' as QuizMode,
    label: 'Điền từ vào chỗ trống',
    desc: 'Gõ từ còn thiếu trong ngữ cảnh câu',
    badge: 'Thử thách',
    icon: EditIcon,
    available: true,
  },
];

export const PRESET_COUNTS: (5 | 10 | 20)[] = [5, 10, 20];

export function QuizSetupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    topicId?: string;
    topicName?: string;
  }>();

  // Navigation back
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

  // Topic determination: Preselect if passed from caller, but allow switching anytime.
  // Never fallback to topicId = 1 or alias deckId (D19).
  const requestedTopicId = params.topicId ? Number(params.topicId) : undefined;
  const [selectedTopicId, setSelectedTopicId] = useState<number | undefined>(requestedTopicId);
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const {
    data: availableTopics = [],
    isLoading: isLoadingTopics,
    isError: isTopicsError,
    refetch: refetchTopics,
  } = useQuizAvailableTopics();

  const selectedTopic = useMemo(() => {
    if (!selectedTopicId)
      return undefined;
    return availableTopics.find(t => t.id === selectedTopicId);
  }, [availableTopics, selectedTopicId]);

  const selectedTopicName = selectedTopic?.name
    ?? (selectedTopicId === requestedTopicId ? params.topicName : undefined);

  const handleOpenTopicPicker = () => {
    bottomSheetRef.current?.present();
  };

  const handleSelectTopic = (topic: QuizAvailableTopic) => {
    setSelectedTopicId(topic.id);
    setIdempotencyKey(generateIdempotencyKey());
    setErrorMessage(null);
  };

  // Quiz parameters
  const [quizMode, setQuizMode] = useState<QuizMode>('MCQ');
  const [direction, setDirection] = useState<QuizDirection>('EN_VI');
  const [questionCount, setQuestionCount] = useState<5 | 10 | 20>(5);

  // Idempotency: generated once per logical intent, reused on network retry
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => generateIdempotencyKey());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createMutation = useCreateQuiz();
  const cancelMutation = useCancelQuiz();
  const [isCheckingUnfinished, setIsCheckingUnfinished] = useState(false);
  const isBusy = createMutation.isPending || cancelMutation.isPending || isCheckingUnfinished;

  const handleModeChange = (mode: QuizMode) => {
    setQuizMode(mode);
    setIdempotencyKey(generateIdempotencyKey());
    setErrorMessage(null);
  };

  const handleDirectionChange = (dir: QuizDirection) => {
    setDirection(dir);
    setIdempotencyKey(generateIdempotencyKey());
    setErrorMessage(null);
  };

  const handleCountChange = (count: 5 | 10 | 20) => {
    setQuestionCount(count);
    setIdempotencyKey(generateIdempotencyKey());
    setErrorMessage(null);
  };

  const openSession = (quizId: number) => {
    router.push({
      pathname: '/(app)/study/quiz-session' as any,
      params: { quizId: String(quizId) },
    });
  };

  /**
   * D18: "Bắt đầu" from Setup always means a NEW session. An unfinished one on the same context is
   * cancelled first, so two IN_PROGRESS quizzes for the same context never coexist.
   */
  const confirmUnfinished = (
    unfinished: QuizHistorySummaryResponse,
    request: CreateQuizRequest,
  ) => {
    const modeLabel = QUIZ_MODES.find(m => m.id === unfinished.mode)?.label ?? unfinished.mode;
    Alert.alert(
      'Bạn có một bài Quiz đang làm dở',
      `${modeLabel} · ${unfinished.questionCount} câu · ${selectedTopicName}.`,
      [
        { text: 'Huỷ', style: 'cancel' },
        { text: 'Tiếp tục bài cũ', onPress: () => openSession(unfinished.quizId) },
        {
          text: 'Bắt đầu bài mới',
          style: 'destructive',
          onPress: () => cancelMutation.mutate(
            { quizId: unfinished.quizId },
            {
              // A new intent: the current key may be the one that created `unfinished`, and
              // reusing it would replay that (now cancelled) quiz instead of creating one.
              onSuccess: () => {
                const key = generateIdempotencyKey();
                setIdempotencyKey(key);
                createQuiz(request, key);
              },
              onError: () => setErrorMessage('Không thể huỷ bài Quiz đang làm dở. Vui lòng thử lại.'),
            },
          ),
        },
      ],
    );
  };

  const handleStartQuiz = async () => {
    if (!selectedTopicId) {
      setErrorMessage('Vui lòng chọn chủ đề từ vựng trước khi bắt đầu bài Quiz.');
      return;
    }
    if (isBusy)
      return;
    setErrorMessage(null);

    const request: CreateQuizRequest = {
      topicId: selectedTopicId,
      mode: quizMode,
      direction: quizMode === 'FILL_BLANK' ? undefined : direction,
      requestedCount: questionCount,
    };

    setIsCheckingUnfinished(true);
    let unfinished: QuizHistorySummaryResponse | undefined;
    try {
      // ponytail: first history page only — a match buried under 20 newer quizzes just falls
      // through to create. Add a status filter to GET /api/me/quizzes if that ever shows up.
      const history = await getQuizHistory({ page: 0, size: 20 });
      unfinished = findResumableQuiz(history?.data ?? [], request);
    }
    catch {
      unfinished = undefined; // history unreachable → keep the old behaviour and just create
    }
    finally {
      setIsCheckingUnfinished(false);
    }

    if (unfinished) {
      confirmUnfinished(unfinished, request);
      return;
    }
    createQuiz(request, idempotencyKey);
  };

  // The key is kept across failures (a lost response replays the same quiz) and rotated once the
  // intent succeeded: Setup stays mounted under Session, so the next "Bắt đầu" is a new quiz.
  const createQuiz = (request: CreateQuizRequest, key: string) => {
    createMutation.mutate(
      { data: request, idempotencyKey: key },
      {
        onSuccess: (data) => {
          setIdempotencyKey(generateIdempotencyKey());
          openSession(data.quizId);
        },
        onError: (err: any) => {
          const errorType = err.response?.data?.error;
          const errData = err.response?.data?.data;

          if (errorType === 'QUIZ_INSUFFICIENT_ELIGIBLE_ITEMS') {
            const eligible = errData?.eligibleCount ?? 0;
            const requested = errData?.requestedCount ?? questionCount;
            const smaller = PRESET_COUNTS.filter(c => c <= eligible).at(-1);
            setErrorMessage(smaller
              ? `Chủ đề này chỉ có ${eligible} từ vựng đủ điều kiện, chưa đủ cho Quiz ${requested} câu. Hãy chọn ${smaller} câu hoặc thêm từ vựng.`
              : `Chủ đề này chỉ có ${eligible} từ vựng đủ điều kiện, cần ít nhất 5 từ để tạo Quiz. Hãy thêm từ vựng hoặc chọn chủ đề khác.`);
          }
          else if (errorType === 'TOPIC_TEMPLATE_NOT_CONFIGURED') {
            setErrorMessage('Chủ đề này chưa cấu hình mẫu thẻ học phù hợp để tạo Quiz.');
          }
          else if (errorType === 'NOT_ENOUGH_DISTINCT_ANSWERS') {
            setErrorMessage('Không đủ đáp án phân biệt để tạo các lựa chọn trắc nghiệm cho chủ đề này.');
          }
          else {
            setErrorMessage('Không thể tạo bài Quiz. Vui lòng kiểm tra lại kết nối và thử lại.');
          }
        },
      },
    );
  };

  // Calculate active fill percentage for question slider
  const selectedIdx = PRESET_COUNTS.indexOf(questionCount);
  const activePercent = (selectedIdx / (PRESET_COUNTS.length - 1)) * 100;

  return (
    <SafeAreaView className="flex-1 bg-[#F7F8FA]" edges={['top']}>

      {/* 1. HEADER */}
      <ScreenHeader title="Thiết lập Quiz" onBack={navigateBackSafely} />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ERROR BANNER */}
        {errorMessage && (
          <View className="mb-6 flex-row items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <AlertTriangleIcon size={24} className="shrink-0 text-red-500" />
            <Text className="flex-1 font-inter text-[13.5px] leading-snug font-semibold text-red-700">
              {errorMessage}
            </Text>
          </View>
        )}

        {/* SECTION 1: CHỦ ĐỀ HIỆN TẠI */}
        <View className="mb-8">
          <Text className="mb-1 font-nunito text-[18px] font-extrabold text-mascot-navy">Chủ đề từ vựng</Text>
          <Text className="mb-3 font-inter text-[13px] font-medium text-neutral-400">
            Chủ đề bạn sẽ rèn luyện phản xạ trong bài Quiz
          </Text>

          {isTopicsError && (
            <View className="mb-3 flex-row items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-3.5">
              <Text className="flex-1 font-inter text-[13px] font-semibold text-red-700">
                Không tải được danh sách chủ đề.
              </Text>
              <Pressable onPress={() => void refetchTopics()} className="min-h-10 justify-center px-2 active:opacity-60">
                <Text className="font-nunito text-[13px] font-extrabold text-red-700">Thử lại</Text>
              </Pressable>
            </View>
          )}

          {selectedTopicId && selectedTopicName ? (
            <Pressable
              onPress={handleOpenTopicPicker}
              className="flex-row items-center justify-between rounded-2xl border-2 border-b-4 border-primary-500 bg-primary-50/80 p-3.5 active:translate-y-px"
            >
              <View className="flex-1 flex-row items-center gap-3 pr-2">
                <View className="size-11 items-center justify-center rounded-xl border border-primary-200 bg-white shadow-xs">
                  <Text className="text-[22px]">🎯</Text>
                </View>
                <View className="flex-1">
                  <Text className="mb-0.5 font-nunito text-[15px] font-extrabold text-primary-800" numberOfLines={1}>
                    {selectedTopicName}
                  </Text>
                  <Text className="font-inter text-[12px] font-medium text-primary-700" numberOfLines={1}>
                    {selectedTopic?.collectionName
                      ? `Bộ sưu tập: ${selectedTopic.collectionName}`
                      : (selectedTopic?.translation || 'Toàn bộ từ vựng trong chủ đề')}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center gap-1 rounded-xl border border-primary-200 bg-white/90 px-2.5 py-1.5 shadow-xs">
                <Text className="font-nunito text-[12px] font-extrabold text-primary-700">Đổi</Text>
                <ChevronRightIcon size={14} className="text-primary-600" />
              </View>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleOpenTopicPicker}
              className="flex-row items-center justify-between rounded-2xl border-2 border-dashed border-neutral-300 bg-white p-4 active:bg-neutral-50"
            >
              <View className="flex-1 flex-row items-center gap-3 pr-2">
                <View className="size-11 items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50">
                  <Text className="text-[22px]">📚</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-nunito text-[15px] font-extrabold text-mascot-navy">
                    Chọn chủ đề
                  </Text>
                  <Text className="font-inter text-[12px] font-medium text-neutral-400">
                    Chạm để chọn nguồn từ vựng làm bài Quiz
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center gap-1 rounded-xl bg-neutral-100 px-2.5 py-1.5">
                <Text className="font-nunito text-[12px] font-bold text-neutral-600">Chọn</Text>
                <ChevronRightIcon size={14} className="text-neutral-500" />
              </View>
            </Pressable>
          )}
        </View>

        {/* SECTION 2: CHỌN HƯỚNG TRẮC NGHIỆM (Chỉ cho MCQ & MATCHING) */}
        {quizMode !== 'FILL_BLANK' && (
          <View className="mb-8">
            <Text className="mb-1 font-nunito text-[18px] font-extrabold text-mascot-navy">Chiều ôn tập</Text>
            <Text className="mb-3 font-inter text-[13px] font-medium text-neutral-400">
              Chọn cách bạn muốn hiển thị câu hỏi và đáp án
            </Text>

            <View className="flex-row gap-3">
              {/* Option EN -> VI */}
              <Pressable
                onPress={() => handleDirectionChange('EN_VI')}
                className={cn(
                  'flex-1 items-center rounded-2xl border-2 border-b-4 p-3.5 transition-all',
                  direction === 'EN_VI'
                    ? 'border-primary-500 bg-primary-50/80 active:translate-y-px active:border-b-[3px]'
                    : 'border-neutral-100 bg-white active:translate-y-[2px] active:border-b-2 active:bg-neutral-50',
                )}
              >
                <Text className="mb-1.5 text-[20px]">🇬🇧 ➔ 🇻🇳</Text>
                <Text
                  className={cn(
                    'mb-0.5 text-center font-nunito text-[14px] font-extrabold',
                    direction === 'EN_VI' ? 'text-primary-800' : 'text-mascot-navy',
                  )}
                >
                  Anh → Việt
                </Text>
                <Text
                  className={cn(
                    'text-center font-inter text-[11px] font-medium',
                    direction === 'EN_VI' ? 'text-primary-700' : 'text-neutral-400',
                  )}
                >
                  Từ vựng ➔ Nghĩa đúng
                </Text>
              </Pressable>

              {/* Option VI -> EN */}
              <Pressable
                onPress={() => handleDirectionChange('VI_EN')}
                className={cn(
                  'flex-1 items-center rounded-2xl border-2 border-b-4 p-3.5 transition-all',
                  direction === 'VI_EN'
                    ? 'border-primary-500 bg-primary-50/80 active:translate-y-px active:border-b-[3px]'
                    : 'border-neutral-100 bg-white active:translate-y-[2px] active:border-b-2 active:bg-neutral-50',
                )}
              >
                <Text className="mb-1.5 text-[20px]">🇻🇳 ➔ 🇬🇧</Text>
                <Text
                  className={cn(
                    'mb-0.5 text-center font-nunito text-[14px] font-extrabold',
                    direction === 'VI_EN' ? 'text-primary-800' : 'text-mascot-navy',
                  )}
                >
                  Việt → Anh
                </Text>
                <Text
                  className={cn(
                    'text-center font-inter text-[11px] font-medium',
                    direction === 'VI_EN' ? 'text-primary-700' : 'text-neutral-400',
                  )}
                >
                  Nghĩa ➔ Phản xạ từ
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* SECTION 3: CHỌN KIỂU QUIZ */}
        <View className="mb-8">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="font-nunito text-[18px] font-extrabold text-mascot-navy">Chế độ Quiz</Text>
            <View className="flex-row items-center gap-1 rounded-md border border-warning-200 bg-warning-50 px-2 py-0.5">
              <SparklesIcon size={12} className="text-warning-600" />
              <Text className="font-inter text-[11px] font-bold text-warning-700">Chấm tự động</Text>
            </View>
          </View>

          <View className="gap-3">
            {QUIZ_MODES.map((mode) => {
              const isSelected = quizMode === mode.id;
              const Icon = mode.icon;
              return (
                <Pressable
                  key={mode.id}
                  onPress={() => handleModeChange(mode.id)}
                  className={cn(
                    'flex-row items-center justify-between rounded-2xl border-2 border-b-4 p-4 transition-all',
                    isSelected
                      ? 'border-primary-500 bg-primary-50/80 active:translate-y-px active:border-b-[3px]'
                      : 'border-neutral-100 bg-white active:translate-y-[2px] active:border-b-2 active:bg-neutral-50',
                  )}
                >
                  <View className="flex-1 flex-row items-center gap-3.5 pr-2">
                    <View
                      className={cn(
                        'size-12 items-center justify-center rounded-xl border',
                        isSelected ? 'border-primary-600 bg-primary-500' : 'border-neutral-200 bg-neutral-100',
                      )}
                    >
                      <Icon size={22} className={isSelected ? 'text-white' : 'text-neutral-500'} />
                    </View>
                    <View className="flex-1">
                      <View className="mb-0.5 flex-row items-center gap-2">
                        <Text
                          className={cn(
                            'font-nunito text-[15px] font-extrabold',
                            isSelected ? 'text-primary-800' : 'text-mascot-navy',
                          )}
                        >
                          {mode.label}
                        </Text>
                        <View className="rounded-sm border border-primary-200 bg-primary-100 px-1.5 py-0.5 text-[10px]">
                          <Text className="font-inter text-[10px] font-bold text-primary-700">
                            {mode.badge}
                          </Text>
                        </View>
                      </View>
                      <Text
                        className={cn(
                          'font-inter text-[12px] font-medium',
                          isSelected ? 'text-primary-700' : 'text-neutral-400',
                        )}
                      >
                        {mode.desc}
                      </Text>
                    </View>
                  </View>

                  <View
                    className={cn(
                      'size-6 shrink-0 items-center justify-center rounded-full border-2',
                      isSelected ? 'border-primary-500 bg-primary-500' : 'border-neutral-200',
                    )}
                  >
                    {isSelected && <CheckCircleIcon size={14} className="text-white" />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* SECTION 4: SỐ CÂU HỎI (5 | 10 | 20) */}
        <View className="mb-4">
          <Text className="mb-4 font-nunito text-[18px] font-extrabold text-mascot-navy">Số lượng câu hỏi</Text>

          <View className="items-center rounded-3xl border-2 border-neutral-100 bg-white p-6 shadow-sm shadow-black/5">
            <Text className="mb-6 text-center font-nunito text-[38px] font-extrabold text-mascot-navy">
              {questionCount}
              {' '}
              <Text className="font-inter text-[18px] text-neutral-400">câu</Text>
            </Text>

            <View className="relative w-full flex-row items-center justify-between px-6">
              {/* Background Track */}
              <View className="absolute inset-x-10 top-1/2 h-2 -translate-y-1/2 rounded-full bg-neutral-100" />

              {/* Active Filled Track */}
              <View
                className="absolute top-1/2 left-10 h-2 -translate-y-1/2 rounded-full bg-primary-500 transition-all duration-200"
                style={{ width: `${(activePercent * 0.78)}%` }}
              />

              {/* The Steps */}
              {PRESET_COUNTS.map((preset) => {
                const isSelected = questionCount === preset;
                return (
                  <Pressable
                    key={preset}
                    onPress={() => handleCountChange(preset)}
                    className="z-10 w-12 items-center"
                  >
                    <View
                      className={cn(
                        'size-7 items-center justify-center rounded-full border-4 border-white shadow-sm transition-all',
                        isSelected ? 'scale-125 bg-primary-500 shadow-primary-500/40' : 'bg-neutral-300',
                      )}
                    />
                    <Text
                      className={cn(
                        'mt-3 font-inter text-[14px] font-bold',
                        isSelected ? 'font-extrabold text-primary-600' : 'text-neutral-400',
                      )}
                    >
                      {preset}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

      </ScrollView>

      {/* STICKY BOTTOM CTA */}
      <View className="absolute inset-x-0 bottom-0 border-t border-neutral-100 bg-white p-5 shadow-lg shadow-black/5">
        <Pressable
          onPress={handleStartQuiz}
          disabled={!selectedTopicId || isBusy}
          className={cn(
            'h-14 w-full flex-row items-center justify-center gap-2 rounded-2xl border-b-4 transition-all',
            !selectedTopicId
              ? 'border-neutral-300 bg-neutral-200'
              : 'border-primary-700 bg-primary-500 active:translate-y-[2px] active:border-b-2 active:bg-primary-600',
            isBusy && 'opacity-70',
          )}
        >
          {isBusy ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text
                className={cn(
                  'font-nunito text-[16px] font-extrabold tracking-wider uppercase',
                  !selectedTopicId ? 'text-neutral-400' : 'text-white',
                )}
              >
                {selectedTopicId ? `Bắt đầu Quiz (${questionCount} câu)` : 'Chọn chủ đề để bắt đầu'}
              </Text>
              {selectedTopicId && <ArrowRightIcon size={20} className="text-white" />}
            </>
          )}
        </Pressable>
      </View>

      {/* TOPIC PICKER BOTTOM SHEET */}
      <TopicSelectBottomSheet
        bottomSheetRef={bottomSheetRef}
        selectedTopicId={selectedTopicId}
        topics={availableTopics}
        isLoading={isLoadingTopics}
        onSelectTopic={handleSelectTopic}
      />
    </SafeAreaView>
  );
}

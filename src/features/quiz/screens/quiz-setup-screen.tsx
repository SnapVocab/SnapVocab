/* eslint-disable max-lines-per-function */
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { QuizAvailableTopic } from '../api/quiz-api';
import type { CreateQuizRequest, QuizDirection, QuizHistorySummaryResponse, QuizMode } from '../types';
import type { TxKeyPath } from '@/lib/i18n';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BouncingDots, ScreenHeader } from '@/components/ui';
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  EditIcon,
  LayersIcon,
  LayoutGridIcon,
} from '@/components/ui/icons';
import { useColorMode } from '@/components/ui/surface';
import { translate } from '@/lib/i18n';
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
    label: 'quiz.multiple_choice',
    desc: 'quiz.mode_mcq_desc',
    badge: 'quiz.recommended',
    icon: LayoutGridIcon,
    available: true,
  },
  {
    id: 'MATCHING' as QuizMode,
    label: 'quiz.matching',
    desc: 'quiz.mode_matching_desc',
    badge: 'quiz.popular',
    icon: LayersIcon,
    available: true,
  },
  {
    id: 'FILL_BLANK' as QuizMode,
    label: 'quiz.fill_blank',
    desc: 'quiz.mode_fill_blank_desc',
    badge: 'quiz.challenge',
    icon: EditIcon,
    available: true,
  },
] as const satisfies readonly {
  id: QuizMode;
  label: TxKeyPath;
  desc: TxKeyPath;
  badge: TxKeyPath;
  icon: React.ComponentType<any>;
  available: boolean;
}[];

export const PRESET_COUNTS: (5 | 10 | 20)[] = [5, 10, 20];

export function QuizSetupScreen() {
  const isDark = useColorMode() === 'dark';
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
    const modeLabel = translate(QUIZ_MODES.find(m => m.id === unfinished.mode)?.label ?? 'quiz.title');
    Alert.alert(
      translate('quiz.unfinished_title'),
      translate('quiz.unfinished_body', {
        mode: modeLabel,
        count: unfinished.questionCount,
        topic: selectedTopicName,
      }),
      [
        { text: translate('quiz.cancel'), style: 'cancel' },
        { text: translate('quiz.continue_existing'), onPress: () => openSession(unfinished.quizId) },
        {
          text: translate('quiz.start_new'),
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
              onError: () => setErrorMessage(translate('quiz.cancel_unfinished_error')),
            },
          ),
        },
      ],
    );
  };

  const handleStartQuiz = async () => {
    if (!selectedTopicId) {
      setErrorMessage(translate('quiz.select_topic_error'));
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
      // Only resumable sessions of this mode: D18 keeps at most one per context, and TTL caps the rest.
      const history = await getQuizHistory({
        page: 0,
        size: 20,
        mode: request.mode,
        status: 'IN_PROGRESS',
      });
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
              ? translate('quiz.insufficient_requested', { eligible, requested, smaller })
              : translate('quiz.insufficient_minimum', { eligible }));
          }
          else if (errorType === 'TOPIC_TEMPLATE_NOT_CONFIGURED') {
            setErrorMessage(translate('quiz.template_missing'));
          }
          else if (errorType === 'NOT_ENOUGH_DISTINCT_ANSWERS') {
            setErrorMessage(translate('quiz.distractors_missing'));
          }
          else if (errorType === 'SEMANTIC_ROLE_NOT_BOUND' || errorType === 'SEMANTIC_ROLE_AMBIGUOUS') {
            setErrorMessage(translate('quiz.template_invalid'));
          }
          else {
            // Only a request that got no answer is a connection problem.
            setErrorMessage(translate(err.response ? 'quiz.create_failed' : 'quiz.create_error'));
          }
        },
      },
    );
  };

  // Calculate active fill percentage for question slider
  const selectedIdx = PRESET_COUNTS.indexOf(questionCount);
  const activePercent = (selectedIdx / (PRESET_COUNTS.length - 1)) * 100;

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background dark:bg-neutral-950" edges={['top', 'bottom']}>

      {/* 1. HEADER */}
      <ScreenHeader title={translate('quiz.setup_title')} onBack={navigateBackSafely} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ERROR BANNER */}
        {errorMessage && (
          <View className="mb-6 flex-row items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-500/40 dark:bg-red-500/15">
            <AlertTriangleIcon size={24} color={isDark ? '#FCA5A5' : '#EF4444'} className="shrink-0" />
            <Text className="flex-1 font-inter text-[13.5px] leading-snug font-semibold text-red-700 dark:text-red-300">
              {errorMessage}
            </Text>
          </View>
        )}

        {/* SECTION 1: CHỦ ĐỀ HIỆN TẠI */}
        <View className="mb-8">
          <Text className="mb-1 font-nunito text-[18px] font-extrabold text-mascot-navy dark:text-white">{translate('quiz.topic')}</Text>
          <Text className="mb-3 font-inter text-[13px] font-medium text-neutral-500 dark:text-neutral-400">
            {translate('quiz.topic_hint')}
          </Text>

          {isTopicsError && (
            <View className="mb-3 flex-row items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-3.5 dark:border-red-500/40 dark:bg-red-500/15">
              <Text className="flex-1 font-inter text-[13px] font-semibold text-red-700 dark:text-red-300">
                {translate('quiz.topics_load_error')}
              </Text>
              <Pressable onPress={() => void refetchTopics()} className="min-h-10 justify-center px-2 active:opacity-60">
                <Text className="font-nunito text-[13px] font-extrabold text-red-700 dark:text-red-300">{translate('quiz.retry')}</Text>
              </Pressable>
            </View>
          )}

          {selectedTopicId && selectedTopicName ? (
            <Pressable
              onPress={handleOpenTopicPicker}
              className="flex-row items-center justify-between rounded-2xl border-2 border-b-4 border-primary-500 bg-primary-50/80 p-3.5 active:translate-y-px dark:border-[#7FA35E] dark:bg-primary-500/15"
            >
              <View className="flex-1 flex-row items-center gap-3 pr-2">
                <View className="size-11 items-center justify-center rounded-xl border border-primary-200 bg-surface shadow-xs dark:border-primary-800">
                  <Text className="text-[22px]">🎯</Text>
                </View>
                <View className="flex-1">
                  <Text className="mb-0.5 font-nunito text-[15px] font-extrabold text-primary-800 dark:text-primary-200" numberOfLines={1}>
                    {selectedTopicName}
                  </Text>
                  <Text className="font-inter text-[12px] font-medium text-primary-700 dark:text-primary-300" numberOfLines={1}>
                    {selectedTopic?.collectionName
                      ? translate('quiz.collection_prefix', { name: selectedTopic.collectionName })
                      : (selectedTopic?.translation || translate('quiz.topic_all_words'))}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center gap-1 rounded-xl border border-primary-200 bg-surface/90 px-2.5 py-1.5 shadow-xs dark:border-primary-800">
                <Text className="font-nunito text-[12px] font-extrabold text-primary-700 dark:text-primary-200">{translate('quiz.change')}</Text>
                <ChevronRightIcon size={14} className="text-primary-600 dark:text-primary-300" />
              </View>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleOpenTopicPicker}
              className="flex-row items-center justify-between rounded-2xl border-2 border-dashed border-edge bg-surface p-4 active:bg-pressed"
            >
              <View className="flex-1 flex-row items-center gap-3 pr-2">
                <View className="size-11 items-center justify-center rounded-xl border border-dashed border-edge bg-neutral-50 dark:bg-neutral-800">
                  <Text className="text-[22px]">📚</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-nunito text-[15px] font-extrabold text-mascot-navy dark:text-white">
                    {translate('quiz.choose_topic')}
                  </Text>
                  <Text className="font-inter text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
                    {translate('quiz.choose_topic_hint')}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center gap-1 rounded-xl bg-neutral-100 px-2.5 py-1.5 dark:bg-neutral-800">
                <Text className="font-nunito text-[12px] font-bold text-neutral-600 dark:text-neutral-200">{translate('quiz.choose')}</Text>
                <ChevronRightIcon size={14} className="text-neutral-500 dark:text-neutral-400" />
              </View>
            </Pressable>
          )}
        </View>

        {/* SECTION 2: CHỌN HƯỚNG TRẮC NGHIỆM (Chỉ cho MCQ & MATCHING) */}
        {quizMode !== 'FILL_BLANK' && (
          <View className="mb-8">
            <Text className="mb-1 font-nunito text-[18px] font-extrabold text-mascot-navy dark:text-white">{translate('quiz.direction')}</Text>
            <Text className="mb-3 font-inter text-[13px] font-medium text-neutral-500 dark:text-neutral-400">
              {translate('quiz.direction_hint')}
            </Text>

            <View className="flex-row gap-3">
              {/* Option EN -> VI */}
              <Pressable
                onPress={() => handleDirectionChange('EN_VI')}
                className={cn(
                  'flex-1 items-center rounded-2xl border-2 border-b-4 p-3.5 transition-all',
                  direction === 'EN_VI'
                    ? 'border-primary-500 bg-primary-50/80 active:translate-y-px active:border-b-[3px] dark:border-[#7FA35E] dark:bg-primary-500/15'
                    : 'border-line bg-surface active:translate-y-[2px] active:border-b-2 active:bg-pressed',
                )}
              >
                <Text className="mb-1.5 text-[20px]">🇬🇧 ➔ 🇻🇳</Text>
                <Text
                  className={cn(
                    'mb-0.5 text-center font-nunito text-[14px] font-extrabold',
                    direction === 'EN_VI' ? 'text-primary-800 dark:text-primary-200' : 'text-mascot-navy dark:text-white',
                  )}
                >
                  {translate('quiz.english_to_vietnamese')}
                </Text>
                <Text
                  className={cn(
                    'text-center font-inter text-[11px] font-medium',
                    direction === 'EN_VI' ? 'text-primary-700 dark:text-primary-300' : 'text-neutral-400 dark:text-neutral-400',
                  )}
                >
                  {translate('quiz.word_to_meaning')}
                </Text>
              </Pressable>

              {/* Option VI -> EN */}
              <Pressable
                onPress={() => handleDirectionChange('VI_EN')}
                className={cn(
                  'flex-1 items-center rounded-2xl border-2 border-b-4 p-3.5 transition-all',
                  direction === 'VI_EN'
                    ? 'border-primary-500 bg-primary-50/80 active:translate-y-px active:border-b-[3px] dark:border-[#7FA35E] dark:bg-primary-500/15'
                    : 'border-line bg-surface active:translate-y-[2px] active:border-b-2 active:bg-pressed',
                )}
              >
                <Text className="mb-1.5 text-[20px]">🇻🇳 ➔ 🇬🇧</Text>
                <Text
                  className={cn(
                    'mb-0.5 text-center font-nunito text-[14px] font-extrabold',
                    direction === 'VI_EN' ? 'text-primary-800 dark:text-primary-200' : 'text-mascot-navy dark:text-white',
                  )}
                >
                  {translate('quiz.vietnamese_to_english')}
                </Text>
                <Text
                  className={cn(
                    'text-center font-inter text-[11px] font-medium',
                    direction === 'VI_EN' ? 'text-primary-700 dark:text-primary-300' : 'text-neutral-400 dark:text-neutral-400',
                  )}
                >
                  {translate('quiz.meaning_to_word')}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* SECTION 3: CHỌN KIỂU QUIZ */}
        <View className="mb-8">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="font-nunito text-[18px] font-extrabold text-mascot-navy dark:text-white">{translate('quiz.mode')}</Text>
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
                      ? 'border-primary-500 bg-primary-50/80 active:translate-y-px active:border-b-[3px] dark:border-[#7FA35E] dark:bg-primary-500/15'
                      : 'border-line bg-surface active:translate-y-[2px] active:border-b-2 active:bg-pressed',
                  )}
                >
                  <View className="flex-1 flex-row items-center gap-3.5 pr-2">
                    <View
                      className={cn(
                        'size-12 items-center justify-center rounded-xl border',
                        isSelected ? 'border-brand-edge bg-brand' : 'border-line bg-surface-raised',
                      )}
                    >
                      <Icon size={22} className={isSelected ? 'text-on-brand' : 'text-neutral-500 dark:text-neutral-300'} />
                    </View>
                    <View className="flex-1">
                      <View className="mb-0.5 flex-row items-center gap-2">
                        <Text
                          className={cn(
                            'font-nunito text-[15px] font-extrabold',
                            isSelected ? 'text-primary-800 dark:text-primary-200' : 'text-mascot-navy dark:text-white',
                          )}
                        >
                          {translate(mode.label)}
                        </Text>
                        <View className="rounded-sm border border-primary-200 bg-primary-100 px-1.5 py-0.5 text-[10px] dark:border-primary-800 dark:bg-primary-500/15">
                          <Text className="font-inter text-[10px] font-bold text-primary-700 dark:text-primary-200">
                            {translate(mode.badge)}
                          </Text>
                        </View>
                      </View>
                      <Text
                        className={cn(
                          'font-inter text-[12px] font-medium',
                          isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-neutral-400 dark:text-neutral-400',
                        )}
                      >
                        {translate(mode.desc)}
                      </Text>
                    </View>
                  </View>

                  <View
                    className={cn(
                      'size-6 shrink-0 items-center justify-center rounded-full border-2',
                      isSelected ? 'border-brand bg-brand' : 'border-edge',
                    )}
                  >
                    {isSelected && <CheckCircleIcon size={14} className="text-on-brand" />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* SECTION 4: SỐ CÂU HỎI (5 | 10 | 20) */}
        <View className="mb-4">
          <Text className="mb-4 font-nunito text-[18px] font-extrabold text-mascot-navy dark:text-white">{translate('quiz.question_count')}</Text>

          <View className="items-center rounded-3xl border-2 border-line bg-surface p-6 shadow-sm shadow-black/5">
            <Text className="mb-6 text-center font-nunito text-[38px] font-extrabold text-mascot-navy dark:text-white">
              {questionCount}
              {' '}
              <Text className="font-inter text-[18px] text-neutral-400">{translate('quiz.questions')}</Text>
            </Text>

            <View className="relative w-full flex-row items-center justify-between px-6">
              {/* Background Track */}
              <View className="absolute inset-x-10 top-1/2 h-2 -translate-y-1/2 rounded-full bg-neutral-100 dark:bg-neutral-700" />

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
                        'size-7 items-center justify-center rounded-full border-4 border-white shadow-sm transition-all dark:border-neutral-800',
                        isSelected ? 'scale-125 bg-primary-500 shadow-primary-500/40' : 'bg-neutral-300 dark:bg-neutral-600',
                      )}
                    />
                    <Text
                      className={cn(
                        'mt-3 font-inter text-[14px] font-bold',
                        isSelected ? 'font-extrabold text-primary-600 dark:text-primary-300' : 'text-neutral-400 dark:text-neutral-400',
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
      <View
        className="border-t border-line bg-surface p-5 shadow-lg shadow-black/5"
      >
        <Pressable
          onPress={handleStartQuiz}
          disabled={!selectedTopicId || isBusy}
          accessibilityRole="button"
          accessibilityLabel={selectedTopicId ? translate('quiz.start_counted', { count: questionCount }) : translate('quiz.select_topic_to_start')}
          accessibilityState={{ disabled: !selectedTopicId || isBusy, busy: isBusy }}
          className={cn(
            'h-14 w-full flex-row items-center justify-center gap-2 rounded-2xl border-b-4 transition-all',
            !selectedTopicId
              ? 'border-edge bg-muted'
              : 'border-brand-edge bg-brand active:translate-y-[2px] active:border-b-2 active:bg-brand-pressed',
            isBusy && 'opacity-70',
          )}
        >
          {isBusy ? (
            <BouncingDots color={isDark ? '#1B2416' : '#FFFFFF'} />
          ) : (
            <>
              <Text
                className={cn(
                  'font-nunito text-[16px] font-extrabold tracking-wider uppercase',
                  !selectedTopicId ? 'text-neutral-400' : 'text-on-brand',
                )}
              >
                {selectedTopicId ? translate('quiz.start_counted', { count: questionCount }) : translate('quiz.select_topic_to_start')}
              </Text>
              {selectedTopicId && <ArrowRightIcon size={20} className="text-on-brand" />}
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

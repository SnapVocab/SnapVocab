/* eslint-disable max-lines-per-function */
import type { QuizDirection, QuizMode } from '../types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  EditIcon,
  LayersIcon,
  LayoutGridIcon,
  SparklesIcon,
} from '@/components/ui/icons';
import { Snapy } from '@/components/ui/snapy';

import { cn } from '@/lib/utils';

// ==========================================
// TYPES & MOCK DATA
// ==========================================

export type TopicItem = {
  id: string;
  name: string;
  emoji: string;
  wordCount: number;
  desc: string;
};

export const AVAILABLE_TOPICS: TopicItem[] = [
  { id: 't1', name: 'Du lịch & Sân bay', emoji: '✈️', wordCount: 28, desc: 'Check-in, hành lý, chuyến bay' },
  { id: 't2', name: 'TOEIC Công sở & Giao tiếp', emoji: '🎯', wordCount: 50, desc: 'Họp hành, đàm phán, email công việc' },
  { id: 't3', name: 'Đời sống & Thường nhật', emoji: '☕', wordCount: 35, desc: 'Ẩm thực, mua sắm, giải trí' },
  { id: 't4', name: 'Công nghệ & Đổi mới', emoji: '🚀', wordCount: 24, desc: 'Thiết bị thông minh, ứng dụng số' },
];

export const QUIZ_MODES = [
  {
    id: 'MULTIPLE_CHOICE' as QuizMode,
    label: 'Trắc nghiệm phản xạ',
    desc: 'Chọn nhanh đáp án đúng trong 4 lựa chọn',
    badge: 'Khuyên dùng',
    icon: LayoutGridIcon,
    available: true,
  },
  {
    id: 'MATCHING' as QuizMode,
    label: 'Ghép đôi từ vựng',
    desc: 'Nối các cặp từ tiếng Anh với nghĩa tiếng Việt',
    badge: 'Phổ biến',
    icon: LayersIcon,
    available: true,
  },
  {
    id: 'FILL_BLANK' as QuizMode,
    label: 'Điền từ vào chỗ trống',
    desc: 'Gõ hoặc chọn từ còn thiếu trong ngữ cảnh câu',
    badge: 'Thử thách',
    icon: EditIcon,
    available: true,
  },
];

export const PRESET_COUNTS = [5, 10, 15, 20];

export function QuizSetupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    deckId?: string;
    topicId?: string;
    deckName?: string;
    topicName?: string;
  }>();

  // Safe navigation back to avoid empty history crash
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

  // Find selected topic or fallback
  const requestedId = params.topicId || params.deckId;
  const matchedTopic = AVAILABLE_TOPICS.find(t => t.id === requestedId) || AVAILABLE_TOPICS[0];
  const [selectedTopic, setSelectedTopic] = useState<TopicItem>(matchedTopic);
  const [quizMode, setQuizMode] = useState<QuizMode>('MULTIPLE_CHOICE');
  const [direction, setDirection] = useState<QuizDirection>('EN_VI');
  const [questionCount, setQuestionCount] = useState<number>(5);

  // Validate if topic has enough words (UC-17 invariant: >= 4 words)
  const isSufficient = selectedTopic.wordCount >= 4;

  // Dynamically filter presets based on available words
  const availablePresets = PRESET_COUNTS.filter(count => count <= selectedTopic.wordCount);
  if (selectedTopic.wordCount >= 4 && !availablePresets.includes(questionCount)) {
    const fallback = availablePresets[availablePresets.length - 1] || 5;
    if (questionCount > fallback) {
      setQuestionCount(fallback);
    }
  }

  const handleStartQuiz = () => {
    router.push({
      pathname: '/(app)/study/quiz-session' as any,
      params: {
        topicId: selectedTopic.id,
        topicName: selectedTopic.name,
        mode: quizMode,
        count: String(questionCount),
        direction,
      },
    });
  };

  // Calculate active fill percentage for question slider
  const selectedIdx = Math.max(0, availablePresets.indexOf(questionCount));
  const activePercent = availablePresets.length > 1 ? (selectedIdx / (availablePresets.length - 1)) * 100 : 0;

  return (
    <SafeAreaView className="flex-1 bg-[#F7F8FA]" edges={['top']}>

      {/* 1. HEADER */}
      <View className="z-10 flex-row items-center justify-between border-b border-neutral-100 bg-white px-4 py-3">
        <Pressable
          onPress={navigateBackSafely}
          className="-ml-2 size-10 items-center justify-center rounded-full active:bg-neutral-100"
        >
          <ChevronLeftIcon size={28} className="text-mascot-navy" />
        </Pressable>
        <Text className="flex-1 pr-8 text-center font-nunito text-[18px] font-extrabold text-mascot-navy">Thiết lập Quiz</Text>
      </View>

      {!isSufficient
        ? (
            // ==========================================
            // EMPTY STATE: INSUFFICIENT WORDS
            // ==========================================
            <View className="flex-1 items-center justify-center p-6">
              <Snapy pose="suy_nghi" animation="idle" style={{ width: 140, height: 140 }} className="mb-6" />
              <Text className="mb-2 text-center font-nunito text-[22px] font-extrabold text-mascot-navy">Chưa đủ từ để tạo Quiz</Text>
              <Text className="mb-8 px-4 text-center font-inter text-[15px] font-medium text-neutral-500">
                Chủ đề này chỉ có
                {' '}
                {selectedTopic.wordCount}
                {' '}
                từ. Bạn cần ít nhất 4 từ để bắt đầu một bài quiz phản xạ.
              </Text>
              <Pressable
                onPress={navigateBackSafely}
                className="h-14 w-full flex-row items-center justify-center gap-2 rounded-2xl border-b-4 border-primary-700 bg-primary-500 transition-all active:translate-y-[2px] active:border-b-2 active:bg-primary-600"
              >
                <Text className="font-nunito text-[16px] font-extrabold tracking-wide text-white uppercase">Quay lại & Thêm từ</Text>
              </Pressable>
            </View>
          )
        : (
            // ==========================================
            // NORMAL STATE: CONFIGURATION
            // ==========================================
            <>
              <ScrollView
                contentContainerStyle={{ padding: 20, paddingBottom: 130 }}
                showsVerticalScrollIndicator={false}
              >

                {/* SECTION 1: CHỌN CHỦ ĐỀ (TOPIC) */}
                <View className="mb-8">
                  <View className="mb-1 flex-row items-center justify-between">
                    <Text className="font-nunito text-[18px] font-extrabold text-mascot-navy">Chủ đề từ vựng</Text>
                    <Text className="font-inter text-[12px] font-bold text-primary-600">
                      {AVAILABLE_TOPICS.length}
                      {' '}
                      chủ đề
                    </Text>
                  </View>
                  <Text className="mb-3 font-inter text-[13px] font-bold text-neutral-400">Chọn chủ đề bạn muốn rèn luyện phản xạ</Text>

                  <View className="gap-2.5">
                    {AVAILABLE_TOPICS.map((topic) => {
                      const isSelected = selectedTopic.id === topic.id;
                      return (
                        <Pressable
                          key={topic.id}
                          onPress={() => setSelectedTopic(topic)}
                          className={cn(
                            'flex-row items-center justify-between rounded-2xl border-2 border-b-4 p-3.5 transition-all',
                            isSelected
                              ? 'border-primary-500 bg-primary-50/80 active:translate-y-px active:border-b-[3px]'
                              : 'border-neutral-100 bg-white active:translate-y-[2px] active:border-b-2 active:bg-neutral-50',
                          )}
                        >
                          <View className="flex-1 flex-row items-center gap-3 pr-2">
                            <View className={cn(
                              'size-11 items-center justify-center rounded-xl border',
                              isSelected ? 'border-primary-200 bg-white' : 'border-neutral-200 bg-neutral-100',
                            )}
                            >
                              <Text className="text-[22px]">{topic.emoji}</Text>
                            </View>
                            <View className="flex-1">
                              <Text className={cn(
                                'mb-0.5 font-nunito text-[15px] font-extrabold',
                                isSelected ? 'text-primary-800' : 'text-mascot-navy',
                              )}
                              >
                                {topic.name}
                              </Text>
                              <Text className={cn(
                                'font-inter text-[12px] font-bold',
                                isSelected ? 'text-primary-600' : 'text-neutral-400',
                              )}
                              >
                                {topic.wordCount}
                                {' '}
                                từ khả dụng •
                                {topic.desc}
                              </Text>
                            </View>
                          </View>
                          <View className={cn(
                            'size-5 shrink-0 items-center justify-center rounded-full border-2',
                            isSelected ? 'border-primary-500 bg-primary-500' : 'border-neutral-200',
                          )}
                          >
                            {isSelected && <CheckCircleIcon size={12} className="text-white" />}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* SECTION 2: CHỌN CHIỀU DỊCH (QUIZ DIRECTION) */}
                <View className="mb-8">
                  <Text className="mb-1 font-nunito text-[18px] font-extrabold text-mascot-navy">Hướng câu hỏi</Text>
                  <Text className="mb-3 font-inter text-[13px] font-bold text-neutral-400">Tùy biến chiều phản xạ Anh - Việt</Text>

                  <View className="flex-row gap-3">
                    {/* Option EN -> VI */}
                    <Pressable
                      onPress={() => setDirection('EN_VI')}
                      className={cn(
                        'flex-1 items-center rounded-2xl border-2 border-b-4 p-3.5 transition-all',
                        direction === 'EN_VI'
                          ? 'border-primary-500 bg-primary-50/80 active:translate-y-px active:border-b-[3px]'
                          : 'border-neutral-100 bg-white active:translate-y-[2px] active:border-b-2 active:bg-neutral-50',
                      )}
                    >
                      <Text className="mb-1.5 text-[20px]">🇬🇧 ➔ 🇻🇳</Text>
                      <Text className={cn(
                        'mb-0.5 text-center font-nunito text-[14px] font-extrabold',
                        direction === 'EN_VI' ? 'text-primary-800' : 'text-mascot-navy',
                      )}
                      >
                        Anh → Việt
                      </Text>
                      <Text className={cn(
                        'text-center font-inter text-[11px] font-medium',
                        direction === 'EN_VI' ? 'text-primary-700' : 'text-neutral-400',
                      )}
                      >
                        Từ vựng ➔ Nghĩa đúng
                      </Text>
                    </Pressable>

                    {/* Option VI -> EN */}
                    <Pressable
                      onPress={() => setDirection('VI_EN')}
                      className={cn(
                        'flex-1 items-center rounded-2xl border-2 border-b-4 p-3.5 transition-all',
                        direction === 'VI_EN'
                          ? 'border-primary-500 bg-primary-50/80 active:translate-y-px active:border-b-[3px]'
                          : 'border-neutral-100 bg-white active:translate-y-[2px] active:border-b-2 active:bg-neutral-50',
                      )}
                    >
                      <Text className="mb-1.5 text-[20px]">🇻🇳 ➔ 🇬🇧</Text>
                      <Text className={cn(
                        'mb-0.5 text-center font-nunito text-[14px] font-extrabold',
                        direction === 'VI_EN' ? 'text-primary-800' : 'text-mascot-navy',
                      )}
                      >
                        Việt → Anh
                      </Text>
                      <Text className={cn(
                        'text-center font-inter text-[11px] font-medium',
                        direction === 'VI_EN' ? 'text-primary-700' : 'text-neutral-400',
                      )}
                      >
                        Nghĩa ➔ Phản xạ từ
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* SECTION 3: CHỌN KIỂU QUIZ */}
                <View className="mb-8">
                  <View className="mb-4 flex-row items-center justify-between">
                    <Text className="font-nunito text-[18px] font-extrabold text-mascot-navy">Chế độ Quiz</Text>
                    <View className="flex-row items-center gap-1 rounded-md border border-warning-200 bg-warning-50 px-2 py-0.5">
                      <SparklesIcon size={12} className="text-warning-600" />
                      <Text className="font-inter text-[11px] font-bold text-warning-700">+XP & Coin</Text>
                    </View>
                  </View>

                  <View className="gap-3">
                    {QUIZ_MODES.map((mode) => {
                      const isSelected = quizMode === mode.id;
                      const Icon = mode.icon;
                      return (
                        <Pressable
                          key={mode.id}
                          onPress={() => {
                            if (mode.available) {
                              setQuizMode(mode.id);
                            }
                          }}
                          className={cn(
                            'flex-row items-center justify-between rounded-2xl border-2 border-b-4 p-4 transition-all',
                            isSelected
                              ? 'border-primary-500 bg-primary-50/80 active:translate-y-px active:border-b-[3px]'
                              : mode.available
                                ? 'border-neutral-100 bg-white active:translate-y-[2px] active:border-b-2 active:bg-neutral-50'
                                : 'border-neutral-100 bg-neutral-50/70 opacity-75',
                          )}
                        >
                          <View className="flex-1 flex-row items-center gap-3.5 pr-2">
                            <View className={cn(
                              'size-12 items-center justify-center rounded-xl border',
                              isSelected ? 'border-primary-600 bg-primary-500' : 'border-neutral-200 bg-neutral-100',
                            )}
                            >
                              <Icon size={22} className={isSelected ? 'text-white' : 'text-neutral-500'} />
                            </View>
                            <View className="flex-1">
                              <View className="mb-0.5 flex-row items-center gap-2">
                                <Text className={cn(
                                  'font-nunito text-[15px] font-extrabold',
                                  isSelected ? 'text-primary-800' : 'text-mascot-navy',
                                )}
                                >
                                  {mode.label}
                                </Text>
                                <View className={cn(
                                  'rounded-sm px-1.5 py-0.5 text-[10px]',
                                  mode.available
                                    ? 'border border-primary-200 bg-primary-100'
                                    : 'border border-neutral-300 bg-neutral-200',
                                )}
                                >
                                  <Text className={cn(
                                    'font-inter text-[10px] font-bold',
                                    mode.available ? 'text-primary-700' : 'text-neutral-500',
                                  )}
                                  >
                                    {mode.badge}
                                  </Text>
                                </View>
                              </View>
                              <Text className={cn(
                                'font-inter text-[12px] font-medium',
                                isSelected ? 'text-primary-700' : 'text-neutral-400',
                              )}
                              >
                                {mode.desc}
                              </Text>
                            </View>
                          </View>

                          <View className={cn(
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

                {/* SECTION 4: SỐ CÂU HỎI */}
                <View className="mb-4">
                  <Text className="mb-4 font-nunito text-[18px] font-extrabold text-mascot-navy">Số lượng câu hỏi</Text>

                  <View className="items-center rounded-3xl border-2 border-neutral-100 bg-white p-6 shadow-sm shadow-black/5">
                    <Text className="mb-6 text-center font-nunito text-[38px] font-extrabold text-mascot-navy">
                      {questionCount}
                      {' '}
                      <Text className="font-inter text-[18px] text-neutral-400">câu</Text>
                    </Text>

                    <View className="relative w-full flex-row items-center justify-between px-2">
                      {/* Background Track */}
                      <View className="absolute inset-x-6 top-1/2 h-2 -translate-y-1/2 rounded-full bg-neutral-100" />

                      {/* Active Filled Track */}
                      <View
                        className="absolute top-1/2 left-6 h-2 -translate-y-1/2 rounded-full bg-primary-500 transition-all duration-200"
                        style={{ width: `${(activePercent * 0.85)}%` }}
                      />

                      {/* The Steps */}
                      {availablePresets.map((preset) => {
                        const isSelected = questionCount === preset;
                        return (
                          <Pressable
                            key={preset}
                            onPress={() => setQuestionCount(preset)}
                            className="z-10 w-12 items-center"
                          >
                            <View className={cn(
                              'size-7 items-center justify-center rounded-full border-4 border-white shadow-sm transition-all',
                              isSelected ? 'scale-125 bg-primary-500 shadow-primary-500/40' : 'bg-neutral-300',
                            )}
                            />
                            <Text className={cn(
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

                  <View className="mt-4 flex-row items-center justify-center gap-2 px-2">
                    <AlertTriangleIcon size={16} className="text-neutral-400" />
                    <Text className="text-center font-inter text-[13px] font-medium text-neutral-500">
                      Kho từ khả dụng:
                      {' '}
                      {selectedTopic.wordCount}
                      {' '}
                      từ trong chủ đề (
                      {selectedTopic.name}
                      )
                    </Text>
                  </View>
                </View>

              </ScrollView>

              {/* STICKY BOTTOM CTA */}
              <View className="absolute inset-x-0 bottom-0 border-t border-neutral-100 bg-white p-5 shadow-lg shadow-black/5">
                <Pressable
                  onPress={handleStartQuiz}
                  className="h-14 w-full flex-row items-center justify-center gap-2 rounded-2xl border-b-4 border-primary-700 bg-primary-500 transition-all active:translate-y-[2px] active:border-b-2 active:bg-primary-600"
                >
                  <Text className="font-nunito text-[16px] font-extrabold tracking-wider text-white uppercase">
                    Bắt đầu Quiz (
                    {questionCount}
                    {' '}
                    câu)
                  </Text>
                  <ArrowRightIcon size={20} className="text-white" />
                </Pressable>
              </View>
            </>
          )}

    </SafeAreaView>
  );
}

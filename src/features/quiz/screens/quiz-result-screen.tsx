/* eslint-disable max-lines-per-function */
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckCircleIcon,
  HomeIcon,
  RotateCcwIcon,
  SparklesIcon,
  XCircleIcon,
} from '@/components/ui/icons';
import { RewardIcon } from '@/components/ui/rewards/reward-icon';
import { Snapy } from '@/components/ui/snapy';
import { useQuizResult } from '../api/quiz-api';
import { formatQuizAccuracy, formatQuizDuration } from '../utils';

const { height, width } = Dimensions.get('window');

export function QuizResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams<{
    quizId?: string;
  }>();

  const quizId = params.quizId ? Number(params.quizId) : null;
  const { data: result, isLoading } = useQuizResult(quizId);

  const summary = result?.summary;
  const score = summary?.correctCount ?? 0;
  const total = summary?.totalUnits ?? 0;
  const accuracy = summary ? formatQuizAccuracy(summary.accuracy) : 0;
  const topicName = result?.topicName || 'Chủ đề từ vựng';
  const direction = result?.direction || 'EN_VI';

  const wrongAnswers = result?.items?.filter(i => i.outcome === 'INCORRECT') || [];
  const isPerfect = wrongAnswers.length === 0 && score > 0;

  // Animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reward Pop-in
    Animated.sequence([
      Animated.delay(200),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();

    // Confetti Fall
    Animated.timing(confettiAnim, {
      toValue: 1,
      duration: 2200,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [confettiAnim, fadeAnim, scaleAnim]);

  // Simple Confetti Generator
  const renderConfetti = () => {
    const pieces = Array.from({ length: 22 }).map((_, i) => {
      const left = Math.random() * width;
      const size = Math.random() * 8 + 6;
      const rotate = Math.random() * 360;
      const colors = ['#58CC02', '#1CB0F6', '#FFC42E', '#FF8A00', '#2B70C9'];
      const color = colors[i % colors.length];

      const translateY = confettiAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-50, height + 50],
      });
      const rotateInterpolate = confettiAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [`${rotate}deg`, `${rotate + 360}deg`],
      });

      return (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left,
            top: -50,
            width: size,
            height: size,
            backgroundColor: color,
            borderRadius: 3,
            transform: [{ translateY }, { rotate: rotateInterpolate }],
            opacity: confettiAnim.interpolate({
              inputRange: [0, 0.8, 1],
              outputRange: [1, 1, 0],
            }),
          }}
        />
      );
    });

    return <View className="pointer-events-none absolute inset-0 z-50 overflow-hidden">{pieces}</View>;
  };

  const handleGoHome = () => {
    router.replace('/(app)/(tabs)/learn' as any);
  };

  const handleGoHistory = () => {
    router.push('/(app)/study/quiz-history' as any);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F7F8FA]">
        <ActivityIndicator size="large" color="#3B82F6" className="mb-4" />
        <Text className="font-nunito text-[16px] font-extrabold text-mascot-navy">
          Đang tải kết quả...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F7F8FA]" edges={['top']}>

      {/* 1. CONFETTI (Background overlay) */}
      {renderConfetti()}

      <ScrollView
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. CELEBRATION HEADER */}
        <View className="items-center pt-6 pb-4">
          <View className="relative items-center justify-center">
            <View className="absolute size-44 rounded-full bg-warning-200/50 blur-2xl" />
            <Snapy
              pose={isPerfect ? 'tu_hao' : accuracy >= 80 ? 'an_mung' : 'suy_nghi'}
              animation={isPerfect ? 'celebrate' : 'bounce'}
              style={{ width: 130, height: 130 }}
              className="z-10 mb-2"
            />
          </View>
          <Text className="px-4 text-center font-nunito text-[28px] leading-tight font-extrabold text-mascot-navy">
            {isPerfect ? 'PERFECT! XUẤT SẮC' : accuracy >= 70 ? 'HOÀN THÀNH TỐT' : 'HOÀN THÀNH BÀI THI'}
          </Text>
          <Text className="mt-1 px-4 text-center font-inter text-[15px] font-bold text-neutral-500">
            {isPerfect
              ? 'Bạn đã hoàn thành xuất sắc toàn bộ câu hỏi. Phản xạ tuyệt vời!'
              : 'Mỗi bài kiểm tra giúp từ vựng ghi sâu vào trí nhớ!'}
          </Text>
        </View>

        {/* 3. REWARD CENTERPIECE (Honest: no fabricated rewards until M4) */}
        <Animated.View
          style={{ transform: [{ scale: scaleAnim }], opacity: scaleAnim }}
          className="mx-6 mb-7 items-center rounded-[24px] border-2 border-b-[6px] border-neutral-100 bg-white p-6 shadow-sm shadow-black/5"
        >
          <Text className="mb-4 font-inter text-[12px] font-extrabold tracking-widest text-neutral-400 uppercase">
            HỆ THỐNG PHẦN THƯỞNG
          </Text>

          <View className="mb-6 w-full flex-row items-center justify-center gap-10">
            <View className="items-center">
              <View className="mb-2 size-14 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50">
                <RewardIcon type="xp" size={42} />
              </View>
              <Text className="font-nunito text-[16px] font-extrabold text-neutral-400">
                +0 XP
              </Text>
            </View>

            <View className="h-12 w-[1.5px] bg-neutral-100" />

            <View className="items-center">
              <View className="mb-2 size-14 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50">
                <RewardIcon type="coin" size={42} />
              </View>
              <Text className="font-nunito text-[16px] font-extrabold text-neutral-400">
                +0 Coin
              </Text>
            </View>
          </View>

          <View className="w-full flex-row items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
            <SparklesIcon size={18} className="text-amber-600" />
            <Text className="text-center font-inter text-[13px] font-medium text-amber-800">
              Cơ chế nhận EXP & Coin sẽ được kích hoạt ở bản cập nhật tiếp theo.
            </Text>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          {/* 4. SCORE & STATISTICS */}
          <View className="mb-5 items-center">
            {/* Topic & Direction Info Badge */}
            <View className="mb-3 flex-row items-center gap-2">
              <View className="rounded-full border border-neutral-200 bg-white px-3 py-1 shadow-sm">
                <Text className="font-nunito text-[12px] font-bold text-mascot-navy">
                  {topicName}
                </Text>
              </View>
              <View className="rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1">
                <Text className="font-inter text-[11px] font-bold text-primary-700">
                  {direction === 'VI_EN' ? '🇻🇳 ➔ 🇬🇧 Việt - Anh' : '🇬🇧 ➔ 🇻🇳 Anh - Việt'}
                </Text>
              </View>
            </View>

            <Text className="font-nunito text-[40px] leading-tight font-extrabold text-mascot-navy">
              {score}
              {' '}
              /
              {total}
            </Text>
            <Text className="font-inter text-[15px] font-bold text-neutral-500">
              Độ chính xác:
              {' '}
              {accuracy}
              %
            </Text>
          </View>

          <View className="mx-6 mb-7 rounded-3xl border-2 border-neutral-100 bg-white p-5 shadow-sm shadow-black/5">
            <View className="flex-row">
              <View className="flex-1 items-center border-r border-b border-neutral-100 pr-2 pb-4">
                <Text className="font-nunito text-[24px] font-extrabold text-success-600">{score}</Text>
                <Text className="font-inter text-[13px] font-bold text-neutral-500">Đúng</Text>
              </View>
              <View className="flex-1 items-center border-b border-neutral-100 pb-4 pl-2">
                <Text className="font-nunito text-[24px] font-extrabold text-error-600">{total - score}</Text>
                <Text className="font-inter text-[13px] font-bold text-neutral-500">Chưa đúng</Text>
              </View>
            </View>
            <View className="flex-row pt-4">
              <View className="flex-1 items-center border-r border-neutral-100 pr-2">
                <Text className="font-nunito text-[20px] font-extrabold text-mascot-navy">
                  {accuracy}
                  %
                </Text>
                <Text className="font-inter text-[13px] font-bold text-neutral-500">Tỷ lệ chính xác</Text>
              </View>
              <View className="flex-1 items-center pl-2">
                <Text className="font-nunito text-[20px] font-extrabold text-mascot-navy">
                  {formatQuizDuration(result?.durationSeconds)}
                </Text>
                <Text className="font-inter text-[13px] font-bold text-neutral-500">Thời gian làm bài</Text>
              </View>
            </View>
          </View>

          {/* 5. WRONG ANSWERS SECTION */}
          {wrongAnswers.length > 0 ? (
            <View className="mb-8 px-6">
              <Text className="mb-1 font-nunito text-[18px] font-extrabold text-mascot-navy">Cần ôn lại</Text>
              <Text className="mb-4 font-inter text-[13px] font-bold text-neutral-500">
                Bạn có
                {' '}
                {wrongAnswers.length}
                {' '}
                câu hỏi cần củng cố thêm
              </Text>

              <View className="gap-3">
                {wrongAnswers.map((wrong, idx) => (
                  <View key={wrong.questionId || `w_${idx}`} className="rounded-2xl border-2 border-error-100 bg-white p-4 shadow-sm shadow-black/5">
                    <Text className="mb-2.5 font-nunito text-[18px] font-extrabold text-mascot-navy">
                      {wrong.prompt}
                    </Text>
                    <View className="gap-2">
                      <View className="flex-row items-start gap-2.5">
                        <View className="mt-0.5 size-5 items-center justify-center rounded-full border border-success-200 bg-success-100">
                          <CheckCircleIcon size={14} className="text-success-600" />
                        </View>
                        <Text className="flex-1 font-inter text-[14px] font-medium text-neutral-600">
                          Đáp án đúng:
                          {' '}
                          <Text className="font-bold text-success-700">{wrong.correctAnswer}</Text>
                        </Text>
                      </View>
                      {wrong.learnerAnswer && (
                        <View className="flex-row items-start gap-2.5">
                          <View className="mt-0.5 size-5 items-center justify-center rounded-full border border-error-200 bg-error-100">
                            <XCircleIcon size={14} className="text-error-600" />
                          </View>
                          <Text className="flex-1 font-inter text-[14px] font-medium text-neutral-600">
                            Bạn đã trả lời:
                            {' '}
                            <Text className="font-bold text-error-700">{wrong.learnerAnswer}</Text>
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View className="mx-6 mb-8 items-center rounded-3xl border-2 border-success-200 bg-success-50/90 p-6">
              <View className="mb-3 size-12 items-center justify-center rounded-2xl bg-success-500 shadow-md shadow-success-500/20">
                <SparklesIcon size={24} className="text-white" />
              </View>
              <Text className="text-center font-nunito text-[19px] font-extrabold text-success-800">
                Hoàn hảo! 100% Chính Xác
              </Text>
              <Text className="mt-1 text-center font-inter text-[13px] font-medium text-success-700">
                Bạn đã trả lời chính xác tất cả câu hỏi trong bài Quiz!
              </Text>
            </View>
          )}

        </Animated.View>
      </ScrollView>

      {/* 6. BOTTOM ACTIONS */}
      <View
        style={{ bottom: insets.bottom }}
        className="absolute inset-x-0 flex-row gap-3 border-t border-neutral-100 bg-white p-4 shadow-lg shadow-black/5"
      >
        <Pressable
          onPress={handleGoHome}
          className="h-13 flex-1 flex-row items-center justify-center gap-2 rounded-2xl border-b-4 border-neutral-200 bg-neutral-100 active:translate-y-px active:border-b-2 active:bg-neutral-200"
        >
          <HomeIcon size={20} className="text-neutral-700" />
          <Text className="font-nunito text-[15px] font-extrabold text-neutral-700 uppercase">
            Trang chủ
          </Text>
        </Pressable>

        <Pressable
          onPress={handleGoHistory}
          className="h-13 flex-1 flex-row items-center justify-center gap-2 rounded-2xl border-b-4 border-primary-700 bg-primary-500 active:translate-y-px active:border-b-2 active:bg-primary-600"
        >
          <RotateCcwIcon size={20} className="text-white" />
          <Text className="font-nunito text-[15px] font-extrabold text-white uppercase">
            Lịch sử Quiz
          </Text>
        </Pressable>
      </View>

    </SafeAreaView>
  );
}

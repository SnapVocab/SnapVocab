import type { LearningHubSummaryResponse } from '../learning-state';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import {
  FlashcardSpin3D,
  QuizChallenge3D,
  SnapCamera3D,
  TopicBook3D,
} from '@/components/ui/feature-icons';

export type StudyModesGridProps = {
  summary: LearningHubSummaryResponse;
};

const SOFT_CARD_SHADOW = Platform.select({
  web: {
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
  },
  default: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1.5,
  },
}) as any;

export function StudyModesGrid({ summary }: StudyModesGridProps) {
  const router = useRouter();
  const { studyModes } = summary;

  return (
    <View className="mb-4 px-5">
      <View className="mb-2.5 flex-row items-center justify-between">
        <Text className="font-nunito text-[12px] font-extrabold tracking-wider text-neutral-400 uppercase">
          BẠN MUỐN HỌC THẾ NÀO?
        </Text>
        <Text className="font-nunito text-[11px] font-bold text-primary-600 dark:text-primary-400">
          4 chế độ
        </Text>
      </View>

      {/* Lưới 2 × 2 với 4 icon 3D SnapVocab độc quyền */}
      <View className="gap-2.5">
        {/* Hàng 1: Chụp & học + Lật thẻ */}
        <View className="flex-row gap-2.5">
          {/* Chế độ 1: Chụp & học */}
          <Pressable
            onPress={() => router.push('/(app)/(tabs)/camera' as any)}
            className="flex-1 justify-between rounded-2xl border border-neutral-200/70 bg-white p-3 active:scale-[0.98] dark:border-neutral-700 dark:bg-neutral-900"
            style={SOFT_CARD_SHADOW}
          >
            <View className="mb-2 flex-row items-center justify-between">
              <SnapCamera3D size={38} />
              <View className="dark:border-mascot-800 dark:bg-mascot-950/60 rounded-md border border-mascot-200 bg-mascot-50 px-2 py-0.5">
                <Text className="font-nunito text-[10.5px] font-extrabold text-mascot-700 uppercase dark:text-mascot-400">
                  SCAN
                </Text>
              </View>
            </View>
            <View>
              <Text className="font-nunito text-[15px] font-extrabold text-neutral-800 dark:text-white">
                Chụp & học
              </Text>
              <Text className="mt-0.5 font-inter text-[11.5px] font-medium text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
                Biến ảnh thành từ
              </Text>
            </View>
          </Pressable>

          {/* Chế độ 2: Lật thẻ phản xạ */}
          <Pressable
            onPress={() => router.push('/(app)/study/quiz-setup' as any)}
            className="flex-1 justify-between rounded-2xl border border-neutral-200/70 bg-white p-3 active:scale-[0.98] dark:border-neutral-700 dark:bg-neutral-900"
            style={SOFT_CARD_SHADOW}
          >
            <View className="mb-2 flex-row items-center justify-between">
              <FlashcardSpin3D size={38} />
              <View className="dark:bg-info-950/50 rounded-md border border-info-100 bg-info-50 px-2 py-0.5 dark:border-info-800">
                <Text className="font-nunito text-[10.5px] font-extrabold text-info-600 dark:text-info-400">
                  {studyModes.flashcardsCount > 0 ? `${studyModes.flashcardsCount} thẻ` : 'Mới'}
                </Text>
              </View>
            </View>
            <View>
              <Text className="font-nunito text-[15px] font-extrabold text-neutral-800 dark:text-white">
                Lật thẻ
              </Text>
              <Text className="mt-0.5 font-inter text-[11.5px] font-medium text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
                Nhìn ảnh, nhớ từ
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Hàng 2: Quiz nhanh + Học theo chủ đề */}
        <View className="flex-row gap-2.5">
          {/* Chế độ 3: Quiz nhanh */}
          <Pressable
            onPress={() => router.push('/(app)/study/quiz-setup' as any)}
            className="flex-1 justify-between rounded-2xl border border-neutral-200/70 bg-white p-3 active:scale-[0.98] dark:border-neutral-700 dark:bg-neutral-900"
            style={SOFT_CARD_SHADOW}
          >
            <View className="mb-2 flex-row items-center justify-between">
              <QuizChallenge3D size={38} />
              <View className="rounded-md border border-purple-100 bg-purple-50 px-2 py-0.5 dark:border-purple-800 dark:bg-purple-950/50">
                <Text className="font-nunito text-[10.5px] font-extrabold text-purple-600 dark:text-purple-400">
                  QUIZ
                </Text>
              </View>
            </View>
            <View>
              <Text className="font-nunito text-[15px] font-extrabold text-neutral-800 dark:text-white">
                Quiz nhanh
              </Text>
              <Text className="mt-0.5 font-inter text-[11.5px] font-medium text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
                Kiểm tra phản xạ
              </Text>
            </View>
          </Pressable>

          {/* Chế độ 4: Kho chủ đề */}
          <Pressable
            onPress={() => router.push('/(app)/collections' as any)}
            className="flex-1 justify-between rounded-2xl border border-neutral-200/70 bg-white p-3 active:scale-[0.98] dark:border-neutral-700 dark:bg-neutral-900"
            style={SOFT_CARD_SHADOW}
          >
            <View className="mb-2 flex-row items-center justify-between">
              <TopicBook3D size={38} />
              <View className="dark:bg-primary-950/50 rounded-md border border-primary-100 bg-primary-50 px-2 py-0.5 dark:border-primary-800">
                <Text className="font-nunito text-[10.5px] font-extrabold text-primary-700 dark:text-primary-400">
                  {studyModes.collectionsCount}
                  {' '}
                  bộ
                </Text>
              </View>
            </View>
            <View>
              <Text className="font-nunito text-[15px] font-extrabold text-neutral-800 dark:text-white">
                Bộ từ vựng
              </Text>
              <Text className="mt-0.5 font-inter text-[11.5px] font-medium text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
                Khám phá chủ đề
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

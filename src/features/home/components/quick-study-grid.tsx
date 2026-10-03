import { useRouter } from 'expo-router';
import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';
import {
  PodiumTrophy3D,
  QuizChallenge3D,
  SnapCamera3D,
  TopicBook3D,
} from '@/components/snapvocab';
import { Text } from '@/components/ui';

export function QuickStudyGrid() {
  const router = useRouter();

  return (
    <View>
      <Text className="mb-3 font-nunito text-xs font-black tracking-wider text-neutral-400 uppercase">
        Chế độ học tập
      </Text>

      <View className="flex-row flex-wrap gap-3">
        {/* Camera Scan */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/camera')}
          className="min-w-[45%] flex-1 rounded-3xl border border-neutral-100 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900"
        >
          <View className="size-12 items-center justify-center rounded-2xl bg-orange-50 dark:bg-orange-950/30">
            <SnapCamera3D size={40} />
          </View>
          <Text className="mt-3 font-nunito text-base font-black text-neutral-900 dark:text-white">
            Quét Camera
          </Text>
          <Text className="mt-0.5 font-inter text-[11px] text-neutral-400">
            Chụp ảnh học từ AI
          </Text>
        </TouchableOpacity>

        {/* Quiz history (no flashcard/SRS review flow exists yet, so no "Flashcard" entry) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/study/quiz-history')}
          className="min-w-[45%] flex-1 rounded-3xl border border-neutral-100 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900"
        >
          <View className="size-12 items-center justify-center rounded-2xl bg-sky-50 dark:bg-sky-950/30">
            <QuizChallenge3D size={40} />
          </View>
          <Text className="mt-3 font-nunito text-base font-black text-neutral-900 dark:text-white">
            Lịch sử Quiz
          </Text>
          <Text className="mt-0.5 font-inter text-[11px] text-neutral-400">
            Xem lại bài đã làm
          </Text>
        </TouchableOpacity>

        {/* Quiz Test */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/study/quiz-setup')}
          className="min-w-[45%] flex-1 rounded-3xl border border-neutral-100 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900"
        >
          <View className="size-12 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/30">
            <PodiumTrophy3D size={40} />
          </View>
          <Text className="mt-3 font-nunito text-base font-black text-neutral-900 dark:text-white">
            Trắc nghiệm
          </Text>
          <Text className="mt-0.5 font-inter text-[11px] text-neutral-400">
            Thử thách & kiếm XP
          </Text>
        </TouchableOpacity>

        {/* Collections */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/collections')}
          className="min-w-[45%] flex-1 rounded-3xl border border-neutral-100 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900"
        >
          <View className="size-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/30">
            <TopicBook3D size={40} />
          </View>
          <Text className="mt-3 font-nunito text-base font-black text-neutral-900 dark:text-white">
            Bộ sưu tập
          </Text>
          <Text className="mt-0.5 font-inter text-[11px] text-neutral-400">
            Kho chủ đề đa dạng
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

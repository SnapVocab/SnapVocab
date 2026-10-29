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
      <Text tx="home.study_modes" className="mb-3 font-nunito text-xs font-black tracking-wider text-neutral-400 uppercase" />

      <View className="flex-row flex-wrap gap-3">
        {/* Camera Scan */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/camera')}
          className="min-w-[45%] flex-1 rounded-3xl border-2 border-b-2 border-line border-b-edge bg-surface p-4 shadow-xs"
        >
          <View className="size-12 items-center justify-center rounded-2xl bg-orange-50 dark:bg-orange-950/30">
            <SnapCamera3D size={40} />
          </View>
          <Text tx="home.scan_camera" className="mt-3 font-nunito text-base font-black text-neutral-900 dark:text-white" />
          <Text tx="home.scan_camera_hint" className="mt-0.5 font-inter text-[11px] text-neutral-500 dark:text-neutral-300" />
        </TouchableOpacity>

        {/* Quiz history (no flashcard/SRS review flow exists yet, so no "Flashcard" entry) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/study/quiz-history')}
          className="min-w-[45%] flex-1 rounded-3xl border-2 border-b-2 border-line border-b-edge bg-surface p-4 shadow-xs"
        >
          <View className="size-12 items-center justify-center rounded-2xl bg-sky-50 dark:bg-sky-950/30">
            <QuizChallenge3D size={40} />
          </View>
          <Text tx="home.quiz_history" className="mt-3 font-nunito text-base font-black text-neutral-900 dark:text-white" />
          <Text tx="home.quiz_history_hint" className="mt-0.5 font-inter text-[11px] text-neutral-500 dark:text-neutral-300" />
        </TouchableOpacity>

        {/* Quiz Test */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/study/quiz-setup')}
          className="min-w-[45%] flex-1 rounded-3xl border-2 border-b-2 border-line border-b-edge bg-surface p-4 shadow-xs"
        >
          <View className="size-12 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/30">
            <PodiumTrophy3D size={40} />
          </View>
          <Text tx="home.quiz" className="mt-3 font-nunito text-base font-black text-neutral-900 dark:text-white" />
          <Text tx="home.quiz_hint" className="mt-0.5 font-inter text-[11px] text-neutral-500 dark:text-neutral-300" />
        </TouchableOpacity>

        {/* Collections */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/collections')}
          className="min-w-[45%] flex-1 rounded-3xl border-2 border-b-2 border-line border-b-edge bg-surface p-4 shadow-xs"
        >
          <View className="size-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/30">
            <TopicBook3D size={40} />
          </View>
          <Text tx="home.collections" className="mt-3 font-nunito text-base font-black text-neutral-900 dark:text-white" />
          <Text tx="home.collections_hint" className="mt-0.5 font-inter text-[11px] text-neutral-500 dark:text-neutral-300" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

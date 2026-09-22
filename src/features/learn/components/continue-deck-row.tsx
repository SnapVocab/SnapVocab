import type { ActiveSessionInfo, HubState } from '../learning-state';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { PlayIcon } from '@/components/ui/icons';

export type ContinueDeckRowProps = {
  activeSession: ActiveSessionInfo | null;
  hubState: HubState;
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

export function ContinueDeckRow({ activeSession, hubState }: ContinueDeckRowProps) {
  const router = useRouter();

  // Ẩn nếu không có bài học dở, hoặc chính bài này đã là Hero phía trên
  if (!activeSession || hubState === 'inProgress') {
    return null;
  }

  const percent = Math.round((activeSession.progress / Math.max(1, activeSession.total)) * 100);

  return (
    <View className="mb-4 px-5">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="font-nunito text-[12px] font-extrabold tracking-wider text-neutral-400 uppercase">
          TIẾP TỤC BỘ THẺ
        </Text>
        <Pressable onPress={() => router.push('/(app)/collections' as any)}>
          <Text className="font-inter text-[11.5px] font-bold text-neutral-500 dark:text-neutral-400">
            Xem tất cả →
          </Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => router.push('/(app)/study/quiz-setup' as any)}
        className="flex-row items-center justify-between rounded-2xl border border-neutral-200/70 bg-white p-3.5 active:scale-[0.99] dark:border-neutral-700 dark:bg-neutral-900"
        style={SOFT_CARD_SHADOW}
      >
        <View className="flex-1 flex-row items-center gap-3 pr-2">
          {/* Icon/Emoji của bộ thẻ */}
          <View className="dark:bg-primary-950/50 size-11 shrink-0 items-center justify-center rounded-xl border border-primary-100 bg-primary-50 dark:border-primary-800">
            <Text className="text-[20px]">💼</Text>
          </View>

          <View className="min-w-0 flex-1 pr-2.5">
            <Text className="mb-0.5 font-nunito text-[15px] leading-tight font-extrabold text-neutral-800 dark:text-white" numberOfLines={1}>
              {activeSession.topicName}
            </Text>
            <View className="mt-0.5 flex-row items-center gap-1.5">
              <View className="dark:bg-primary-950/50 shrink-0 rounded-sm border border-primary-200 bg-primary-50 px-1.5 dark:border-primary-800">
                <Text className="font-nunito text-[9.5px] font-extrabold text-primary-700 dark:text-primary-400">
                  {activeSession.level.split('·')[0]?.trim()}
                </Text>
              </View>
              <Text className="font-inter text-[11.5px] font-medium text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
                Bài
                {' '}
                {activeSession.lessonNumber}
                {' '}
                ·
                {' '}
                {activeSession.progress}
                /
                {activeSession.total}
                {' '}
                từ ·
                {' '}
                {percent}
                %
              </Text>
            </View>
          </View>
        </View>

        {/* Nút tiếp tục nhỏ gọn */}
        <View className="shrink-0 flex-row items-center gap-1 rounded-xl border-b-2 border-primary-700 bg-primary-500 px-3 py-2">
          <PlayIcon width={12} height={12} stroke="#FFFFFF" fill="#FFFFFF" />
          <Text className="font-nunito text-[12px] font-extrabold text-white uppercase">
            HỌC TIẾP
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

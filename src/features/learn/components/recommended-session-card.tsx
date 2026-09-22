/* eslint-disable max-lines-per-function */
import type { HubState, LearningHubSummaryResponse } from '../learning-state';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import {
  ArrowRightIcon,
  CameraIcon,
  CheckCircleIcon,
  PlayIcon,
  RepeatIcon,
  SparklesIcon,
} from '@/components/ui/icons';
import { Image } from '@/components/ui/image';
import { Snapy } from '@/components/ui/snapy';

export type RecommendedSessionCardProps = {
  summary: LearningHubSummaryResponse;
  hubState: HubState;
};

const SOFT_HERO_SHADOW = Platform.select({
  web: {
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
  },
  default: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
}) as any;

export function RecommendedSessionCard({
  summary,
  hubState,
}: RecommendedSessionCardProps) {
  const router = useRouter();
  const { fsrsOverview, activeSession, previewDueItems, recentSavedWords } = summary;

  // STATE 1: hasDue (Ưu tiên cao nhất - Ôn tập ngắt quãng FSRS)
  if (hubState === 'hasDue') {
    return (
      <View className="mb-4 px-5">
        <View
          className="overflow-hidden rounded-3xl border border-b-4 border-mascot-navy/90 border-b-neutral-900 bg-mascot-navy p-4.5"
          style={SOFT_HERO_SHADOW}
        >
          {/* Header hàng trên: Nhãn phiên & Độ bền trí nhớ */}
          <View className="mb-2.5 flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5 rounded-full border border-reward-500/30 bg-reward-500/15 px-2.5 py-1">
              <RepeatIcon width={13} height={13} stroke="#FFC42E" />
              <Text className="font-nunito text-[11px] font-extrabold tracking-wider text-reward-500 uppercase">
                PHIÊN ÔN TẬP SRS
              </Text>
            </View>

            <View className="flex-row items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1">
              <SparklesIcon width={11} height={11} stroke="#A0E063" />
              <Text className="font-nunito text-[11px] font-bold text-neutral-200">
                Độ bền:
                {' '}
                {fsrsOverview.retentionRate}
                %
              </Text>
            </View>
          </View>

          {/* Hàng nội dung chính: Thông tin phiên + Snapy + Ảnh preview từ vựng */}
          <View className="mb-3 flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="font-nunito text-[20px] leading-tight font-extrabold text-white">
                {fsrsOverview.dueCount}
                {' '}
                thẻ đến hạn ôn
              </Text>
              <Text className="mt-1 font-inter text-[12.5px] leading-snug font-medium text-neutral-300">
                Ôn ngay để đưa từ vựng vào phản xạ dài hạn.
              </Text>

              {/* Dải ảnh thumbnails xem trước từ vựng */}
              {previewDueItems.length > 0 && (
                <View className="mt-2.5 flex-row items-center gap-2">
                  <View className="flex-row -space-x-2">
                    {previewDueItems.slice(0, 3).map((item, idx) => (
                      <View
                        key={item.id || idx}
                        className="size-8 overflow-hidden rounded-full border-2 border-mascot-navy bg-neutral-700"
                      >
                        {item.imageUrl
                          ? (
                              <Image source={{ uri: item.imageUrl }} className="size-full" contentFit="cover" />
                            )
                          : (
                              <View className="size-full items-center justify-center bg-primary-700">
                                <Text className="text-[10px] font-bold text-white">{item.word.charAt(0).toUpperCase()}</Text>
                              </View>
                            )}
                      </View>
                    ))}
                  </View>
                  <Text className="font-inter text-[11.5px] font-medium text-neutral-300" numberOfLines={1}>
                    {previewDueItems.map(i => i.word).join(', ')}
                  </Text>
                </View>
              )}
            </View>

            <View className="size-20 shrink-0 items-center justify-center">
              <Snapy pose="doc_sach" animation="idle" style={{ width: 76, height: 76 }} />
            </View>
          </View>

          {/* Primary CTA Tactile 3D Button */}
          <Pressable
            onPress={() => router.push('/(app)/study/quiz-setup' as any)}
            className="h-13 w-full flex-row items-center justify-center gap-2 rounded-xl border-b-4 border-primary-700 bg-primary-500 active:translate-y-1 active:border-b-0"
          >
            <Text className="font-nunito text-[15px] font-extrabold tracking-wider text-white uppercase">
              ÔN NGAY (
              {fsrsOverview.dueCount}
              {' '}
              THẺ)
            </Text>
            <ArrowRightIcon width={18} height={18} stroke="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    );
  }

  // STATE 2: newUser (Người mới chưa có từ nào)
  if (hubState === 'newUser') {
    return (
      <View className="mb-4 px-5">
        <View
          className="overflow-hidden rounded-3xl border border-b-4 border-mascot-200/80 border-b-mascot-300/60 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-900"
          style={SOFT_HERO_SHADOW}
        >
          <View className="mb-3 flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <View className="dark:border-mascot-800 dark:bg-mascot-950/60 mb-2 self-start rounded-md border border-mascot-200 bg-mascot-100/70 px-2.5 py-0.5">
                <Text className="text-mascot-800 font-nunito text-[11px] font-extrabold tracking-wider uppercase dark:text-mascot-400">
                  BẮT ĐẦU VỚI SNAPVOCAB
                </Text>
              </View>
              <Text className="font-nunito text-[19px] leading-snug font-extrabold text-neutral-800 dark:text-white">
                Biến đồ vật quanh bạn thành từ tiếng Anh
              </Text>
              <Text className="mt-1 font-inter text-[12.5px] leading-relaxed font-medium text-neutral-500 dark:text-neutral-400">
                Chụp ảnh một món đồ để học ngay cách gọi tên và phát âm tự nhiên.
              </Text>
            </View>

            <View className="size-20 shrink-0 items-center justify-center">
              <Snapy pose="chao_mung" animation="bounce" style={{ width: 80, height: 80 }} />
            </View>
          </View>

          <Pressable
            onPress={() => router.push('/(app)/(tabs)/camera' as any)}
            className="mb-2.5 h-13 w-full flex-row items-center justify-center gap-2 rounded-xl border-b-4 border-mascot-700 bg-mascot-500 active:translate-y-1 active:border-b-0"
          >
            <CameraIcon width={18} height={18} stroke="#FFFFFF" />
            <Text className="font-nunito text-[15px] font-extrabold tracking-wider text-white uppercase">
              CHỤP TỪ ĐẦU TIÊN
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(app)/collections' as any)}
            className="items-center justify-center py-1 active:opacity-70"
          >
            <Text className="font-inter text-[12.5px] font-bold text-neutral-500 dark:text-neutral-400">
              Hoặc khám phá các chủ đề có sẵn →
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // STATE 3: inProgress (Đang có bài học dở dang)
  if (hubState === 'inProgress' && activeSession) {
    const sessionPercent = Math.round(
      (activeSession.progress / Math.max(1, activeSession.total)) * 100,
    );

    return (
      <View className="mb-4 px-5">
        <View
          className="overflow-hidden rounded-3xl border border-b-4 border-neutral-200/70 border-b-neutral-300 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-900"
          style={SOFT_HERO_SHADOW}
        >
          <View className="mb-2 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Text className="dark:bg-primary-950/50 rounded-md border border-primary-100 bg-primary-50 px-2 py-0.5 font-nunito text-[11px] font-extrabold tracking-wider text-primary-600 uppercase dark:border-primary-800 dark:text-primary-400">
                {activeSession.level}
              </Text>
              <Text className="font-nunito text-[11px] font-extrabold tracking-wider text-neutral-400 uppercase">
                BÀI ĐANG HỌC
              </Text>
            </View>
            <Text className="font-inter text-[12px] font-medium text-neutral-400">
              {activeSession.lastStudiedAt}
            </Text>
          </View>

          <View className="mb-3 flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="mb-0.5 font-nunito text-[19px] font-extrabold text-neutral-800 dark:text-white">
                {activeSession.topicName}
              </Text>
              <Text className="mb-2 font-inter text-[13px] font-medium text-neutral-500 dark:text-neutral-400">
                Bài
                {' '}
                {activeSession.lessonNumber}
                :
                {' '}
                {activeSession.lessonTitle}
                {' '}
                ·
                {' '}
                {activeSession.progress}
                /
                {activeSession.total}
                {' '}
                từ
              </Text>

              {/* Progress bar */}
              <View className="flex-row items-center gap-2.5">
                <View className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <View className="h-full rounded-full bg-primary-500" style={{ width: `${sessionPercent}%` }} />
                </View>
                <Text className="font-nunito text-[12px] font-extrabold text-neutral-600 tabular-nums dark:text-neutral-300">
                  {sessionPercent}
                  %
                </Text>
              </View>
            </View>

            <View className="size-18 shrink-0 items-center justify-center">
              <Snapy pose="kham_pha" animation="idle" style={{ width: 72, height: 72 }} />
            </View>
          </View>

          <Pressable
            onPress={() => router.push('/(app)/study/quiz-setup' as any)}
            className="h-13 w-full flex-row items-center justify-center gap-2 rounded-xl border-b-4 border-primary-700 bg-primary-500 active:translate-y-1 active:border-b-0"
          >
            <PlayIcon width={16} height={16} stroke="#FFFFFF" fill="#FFFFFF" />
            <Text className="font-nunito text-[15px] font-extrabold tracking-wider text-white uppercase">
              TIẾP TỤC BÀI
              {' '}
              {activeSession.lessonNumber}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // STATE 4: hasNewWords (Có từ mới lưu, chuẩn bị làm quen)
  if (hubState === 'hasNewWords') {
    return (
      <View className="mb-4 px-5">
        <View
          className="overflow-hidden rounded-3xl border border-b-4 border-neutral-200/70 border-b-neutral-300 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-900"
          style={SOFT_HERO_SHADOW}
        >
          <View className="mb-3 flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <View className="dark:bg-info-950/50 mb-2 self-start rounded-md border border-info-100 bg-info-50 px-2 py-0.5 dark:border-info-800">
                <Text className="font-nunito text-[11px] font-extrabold tracking-wider text-info-600 uppercase dark:text-info-400">
                  TỪ MỚI ĐÃ LƯU
                </Text>
              </View>
              <Text className="font-nunito text-[19px] leading-snug font-extrabold text-neutral-800 dark:text-white">
                Làm quen
                {' '}
                {recentSavedWords.length}
                {' '}
                từ vựng mới
              </Text>
              <Text className="mt-1 font-inter text-[12.5px] font-medium text-neutral-500 dark:text-neutral-400">
                Bắt đầu học để thuật toán FSRS lập lịch ôn tập thông minh cho bạn.
              </Text>
            </View>

            <View className="size-20 shrink-0 items-center justify-center">
              <Snapy pose="to_mo" animation="idle" style={{ width: 74, height: 74 }} />
            </View>
          </View>

          <Pressable
            onPress={() => router.push('/(app)/study/quiz-setup' as any)}
            className="h-13 w-full flex-row items-center justify-center gap-2 rounded-xl border-b-4 border-primary-700 bg-primary-500 active:translate-y-1 active:border-b-0"
          >
            <Text className="font-nunito text-[15px] font-extrabold tracking-wider text-white uppercase">
              HỌC TỪ MỚI NGAY
            </Text>
            <ArrowRightIcon width={18} height={18} stroke="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    );
  }

  // STATE 5: completed (Đã ôn xong & hoàn thành mục tiêu)
  return (
    <View className="mb-4 px-5">
      <View
        className="overflow-hidden rounded-3xl border border-b-4 border-primary-200/70 border-b-primary-300/50 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-900"
        style={SOFT_HERO_SHADOW}
      >
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <View className="dark:bg-primary-950/50 mb-2 flex-row items-center gap-1.5 self-start rounded-full border border-primary-200 bg-primary-50 px-2.5 py-0.5 dark:border-primary-800">
              <CheckCircleIcon width={13} height={13} stroke="#58CC02" />
              <Text className="font-nunito text-[11px] font-extrabold tracking-wider text-primary-700 uppercase dark:text-primary-400">
                ĐÃ HOÀN THÀNH HÔM NAY
              </Text>
            </View>
            <Text className="font-nunito text-[19px] leading-tight font-extrabold text-neutral-800 dark:text-white">
              Trí nhớ đạt trạng thái tối ưu!
            </Text>
            <Text className="mt-1 font-inter text-[12.5px] leading-relaxed font-medium text-neutral-500 dark:text-neutral-400">
              Bạn không còn thẻ nào quá hạn. Hãy mở rộng vốn từ qua các chủ đề mới.
            </Text>
          </View>

          <View className="size-20 shrink-0 items-center justify-center">
            <Snapy pose="tu_hao" animation="idle" style={{ width: 78, height: 78 }} />
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/(app)/collections' as any)}
          className="h-13 w-full flex-row items-center justify-center gap-2 rounded-xl border-b-4 border-primary-700 bg-primary-500 active:translate-y-1 active:border-b-0"
        >
          <Text className="font-nunito text-[15px] font-extrabold tracking-wider text-white uppercase">
            KHÁM PHÁ THÊM BỘ SƯU TẬP
          </Text>
          <ArrowRightIcon width={18} height={18} stroke="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

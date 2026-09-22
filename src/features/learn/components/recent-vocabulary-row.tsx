import type { HubVocabItem } from '../learning-state';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { BookIcon, CameraIcon, ChevronRightIcon } from '@/components/ui/icons';
import { Image } from '@/components/ui/image';

export type RecentVocabularyRowProps = {
  words: HubVocabItem[];
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

export function RecentVocabularyRow({ words }: RecentVocabularyRowProps) {
  const router = useRouter();

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'SCAN':
        return {
          label: 'SCAN',
          bg: 'bg-mascot-50 dark:bg-mascot-950/60',
          border: 'border-mascot-200 dark:border-mascot-800',
          text: 'text-mascot-700 dark:text-mascot-400',
        };
      case 'DICT':
        return {
          label: 'DICT',
          bg: 'bg-info-50 dark:bg-info-950/50',
          border: 'border-info-100 dark:border-info-800',
          text: 'text-info-600 dark:text-info-400',
        };
      default:
        return {
          label: 'TOPIC',
          bg: 'bg-primary-50 dark:bg-primary-950/50',
          border: 'border-primary-100 dark:border-primary-800',
          text: 'text-primary-700 dark:text-primary-400',
        };
    }
  };

  return (
    <View className="mb-4">
      {/* Header Hàng */}
      <View className="mb-2.5 flex-row items-center justify-between px-5">
        <View className="flex-row items-center gap-1.5">
          <Text className="font-nunito text-[12px] font-extrabold tracking-wider text-neutral-400 uppercase">
            TỪ VỰNG CỦA BẠN
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/(app)/collections' as any)}
          className="flex-row items-center gap-0.5 active:opacity-70"
        >
          <Text className="font-inter text-[11.5px] font-bold text-neutral-500 dark:text-neutral-400">
            Mở sổ từ
          </Text>
          <ChevronRightIcon width={13} height={13} stroke="#757793" />
        </Pressable>
      </View>

      {/* Trạng thái 1: Chưa có từ vựng nào */}
      {words.length === 0
        ? (
            <View className="px-5">
              <View
                className="items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900"
                style={SOFT_CARD_SHADOW}
              >
                <View className="dark:border-mascot-800 dark:bg-mascot-950/60 mb-2 size-10 items-center justify-center rounded-full border border-mascot-100 bg-mascot-50">
                  <CameraIcon width={20} height={20} stroke="#FF8A00" />
                </View>
                <Text className="mb-0.5 text-center font-nunito text-[14px] font-extrabold text-neutral-800 dark:text-white">
                  Sổ từ vựng đang trống
                </Text>
                <Text className="mb-3 text-center font-inter text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
                  Chụp ảnh đồ vật quanh bạn để tự động nhận diện và lưu từ vào sổ.
                </Text>
                <Pressable
                  onPress={() => router.push('/(app)/(tabs)/camera' as any)}
                  className="flex-row items-center gap-1.5 rounded-xl bg-mascot-500 px-4 py-2 active:bg-mascot-600"
                >
                  <CameraIcon width={14} height={14} stroke="#FFFFFF" />
                  <Text className="font-nunito text-[12px] font-extrabold text-white uppercase">
                    Chụp từ đầu tiên
                  </Text>
                </Pressable>
              </View>
            </View>
          )
        : (
            /* Trạng thái 2: Cuộn ngang danh sách từ vừa lưu kèm ảnh thực tế */
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
            >
              {words.map((item) => {
                const badge = getSourceBadge(item.sourceTag);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => router.push('/(app)/collections' as any)}
                    className="w-36 overflow-hidden rounded-2xl border border-neutral-200/70 bg-white active:scale-[0.98] dark:border-neutral-700 dark:bg-neutral-900"
                    style={SOFT_CARD_SHADOW}
                  >
                    {/* Ảnh thực tế của từ vựng */}
                    <View className="relative h-24 w-full bg-neutral-100 dark:bg-neutral-800">
                      {item.imageUrl
                        ? (
                            <Image source={{ uri: item.imageUrl }} className="size-full" contentFit="cover" />
                          )
                        : (
                            <View className="dark:bg-primary-950/40 size-full items-center justify-center bg-primary-50">
                              <BookIcon width={24} height={24} stroke="#58CC02" />
                            </View>
                          )}
                      {/* Tag nguồn (SCAN / DICT / TOPIC) */}
                      <View
                        className={`absolute top-2 left-2 rounded-md border px-1.5 py-0.5 ${badge.bg} ${badge.border}`}
                      >
                        <Text className={`font-nunito text-[9.5px] font-extrabold ${badge.text}`}>
                          {badge.label}
                        </Text>
                      </View>
                    </View>

                    {/* Thông tin từ vựng */}
                    <View className="p-2.5">
                      <Text className="font-nunito text-[13.5px] font-extrabold text-neutral-800 dark:text-white" numberOfLines={1}>
                        {item.word}
                      </Text>
                      <Text className="mt-0.5 font-inter text-[11px] font-medium text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
                        {item.meaning}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
    </View>
  );
}

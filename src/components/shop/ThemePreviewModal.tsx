import type { ShopItemDTO } from '@/features/shop/types';
import { SparklesIcon } from 'lucide-react-native';
import * as React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Coin3D } from '@/components/snapvocab';
import { SHOP_THEMES } from '@/features/shop/theme/theme-context';

export type ThemePreviewModalProps = {
  item: ShopItemDTO | null;
  onClose: () => void;
  onPurchase: (item: ShopItemDTO) => void;
};

export function ThemePreviewModal({
  item,
  onClose,
  onPurchase,
}: ThemePreviewModalProps) {
  if (!item) {
    return null;
  }

  const themeKey = item.config?.themeKey;
  const themeDef = themeKey ? SHOP_THEMES[themeKey] : null;

  return (
    <Modal
      visible={Boolean(item)}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/60 p-5">
        <View className="w-full max-w-sm rounded-[32px] border-2 border-neutral-200 bg-white p-6 shadow-2xl">
          <View className="mb-4 items-center">
            <View className="mb-2 size-20 items-center justify-center rounded-2xl bg-purple-50">
              <SparklesIcon size={40} color="#9333EA" />
            </View>
            <Text className="font-nunito text-[20px] font-extrabold text-mascot-navy">
              {item.name}
            </Text>
            <Text className="mt-1 text-center font-inter text-[13px] text-neutral-500">
              {item.description}
            </Text>
          </View>

          {/* Theme Palette Preview Swatches */}
          {themeDef && (
            <View className="mb-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <Text className="mb-2 font-inter text-[11px] font-bold text-neutral-500 uppercase">
                Bản phối màu
              </Text>
              <View className="flex-row gap-2">
                <View
                  style={{
                    backgroundColor: themeDef.surfaceTokens.background,
                  }}
                  className="h-10 flex-1 rounded-xl border border-neutral-300"
                />
                <View
                  style={{
                    backgroundColor: themeDef.surfaceTokens.surface,
                  }}
                  className="h-10 flex-1 rounded-xl border border-neutral-300"
                />
                <View
                  style={{
                    backgroundColor: themeDef.surfaceTokens.surfaceMuted,
                  }}
                  className="h-10 flex-1 rounded-xl border border-neutral-300"
                />
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View className="flex-row gap-3">
            <Pressable
              onPress={onClose}
              className="h-12 flex-1 items-center justify-center rounded-xl bg-neutral-100 active:bg-neutral-200"
            >
              <Text className="font-nunito text-[14px] font-bold text-neutral-600">
                Đóng
              </Text>
            </Pressable>

            <Pressable
              onPress={() => onPurchase(item)}
              className="h-12 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border-b-4 border-primary-700 bg-primary-500 active:border-b-2"
            >
              <Coin3D size="xs" />
              <Text className="font-nunito text-[14px] font-extrabold text-white">
                {item.price}
                {' '}
                Coin
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

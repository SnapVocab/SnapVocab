import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';

type Props = {
  onForgot: () => void;
  onFlip: () => void;
  onRemembered: () => void;
  disabled?: boolean;
};

export function CardActionToolbar({
  onForgot,
  onFlip,
  onRemembered,
  disabled = false,
}: Props) {
  return (
    <View className="w-full flex-row items-center justify-between gap-3 px-2 py-4">
      {/* 1. Forgot / Again Button (Red / Orange) */}
      <Pressable
        onPress={onForgot}
        disabled={disabled}
        android_ripple={{ color: 'transparent' }}
        className="flex-1 items-center justify-center rounded-2xl border-2 border-rose-300 bg-rose-50/90 py-3.5 shadow-sm active:scale-95 active:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40"
      >
        <Text className="font-nunito text-base font-black text-rose-600 dark:text-rose-400">
          ❌ Chưa nhớ
        </Text>
      </Pressable>

      {/* 2. Flip Button (Neutral) */}
      <Pressable
        onPress={onFlip}
        disabled={disabled}
        android_ripple={{ color: 'transparent' }}
        className="size-14 items-center justify-center rounded-2xl border-2 border-neutral-300 bg-neutral-100 shadow-sm active:scale-95 active:bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-800"
      >
        <Text className="text-xl">🔄</Text>
      </Pressable>

      {/* 3. Remembered / Good Button (Green) */}
      <Pressable
        onPress={onRemembered}
        disabled={disabled}
        android_ripple={{ color: 'transparent' }}
        className="flex-1 items-center justify-center rounded-2xl border-2 border-emerald-300 bg-emerald-50/90 py-3.5 shadow-sm active:scale-95 active:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40"
      >
        <Text className="font-nunito text-base font-black text-emerald-600 dark:text-emerald-400">
          ✅ Đã thuộc
        </Text>
      </Pressable>
    </View>
  );
}

export default CardActionToolbar;

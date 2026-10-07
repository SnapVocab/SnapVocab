import * as React from 'react';
import { Pressable, View } from 'react-native';
import { CheckIcon, CloseIcon, RotateCwIcon } from '@/components/ui/icons';
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
    <View className="w-full flex-row items-center justify-between gap-3 px-2 py-3">
      {/* 1. Forgot Button (Rose tint with CloseIcon) */}
      <Pressable
        onPress={onForgot}
        disabled={disabled}
        android_ripple={{ color: 'transparent' }}
        className="h-14 flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/90 shadow-xs active:scale-98 active:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40"
      >
        <CloseIcon width={18} height={18} color="#E11D48" />
        <Text className="font-nunito text-base font-black text-rose-600 dark:text-rose-400">
          Chưa nhớ
        </Text>
      </Pressable>

      {/* 2. Flip Button (Neutral White with RotateCwIcon) */}
      <Pressable
        onPress={onFlip}
        disabled={disabled}
        android_ripple={{ color: 'transparent' }}
        className="size-14 items-center justify-center rounded-2xl border border-neutral-200 bg-white shadow-xs active:scale-95 active:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
      >
        <RotateCwIcon width={22} height={22} color="#475569" />
      </Pressable>

      {/* 3. Remembered Button (Emerald tint with CheckIcon) */}
      <Pressable
        onPress={onRemembered}
        disabled={disabled}
        android_ripple={{ color: 'transparent' }}
        className="h-14 flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/90 shadow-xs active:scale-98 active:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40"
      >
        <CheckIcon width={18} height={18} color="#059669" />
        <Text className="font-nunito text-base font-black text-emerald-600 dark:text-emerald-400">
          Đã thuộc
        </Text>
      </Pressable>
    </View>
  );
}

export default CardActionToolbar;

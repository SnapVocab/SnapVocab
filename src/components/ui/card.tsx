import type { PressableProps, ViewProps } from 'react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { twMerge } from 'tailwind-merge';

import { Text } from './text';

export type CardProps = ViewProps & {
  variant?: 'default' | 'elevated' | 'selected' | 'success' | 'flat';
};

// Surface roles come from global.css tokens, which flip with the theme on their own.
const cardVariants = {
  default: 'border-2 border-b-[4px] border-line border-b-edge bg-surface',
  elevated: 'border border-line bg-surface shadow-md shadow-black/5',
  selected: 'border-2 border-b-[4px] border-primary-500 border-b-primary-600 bg-primary-50 dark:border-[#7FA35E] dark:border-b-[#557044] dark:bg-[#2A3324]',
  success: 'border-2 border-b-[4px] border-emerald-500 border-b-emerald-600 bg-emerald-50 dark:border-emerald-500/70 dark:border-b-emerald-700 dark:bg-[#1F3029]',
  flat: 'border border-line bg-surface-raised',
};

export function Card({ className, variant = 'default', style, ...props }: CardProps) {
  return (
    <View
      className={twMerge(
        'rounded-2xl p-4',
        cardVariants[variant],
        className,
      )}
      style={style}
      {...props}
    />
  );
}

export type CardInteractiveProps = PressableProps & {
  selected?: boolean;
  className?: string;
  children?: React.ReactNode;
};

export function CardInteractive({
  selected = false,
  className,
  children,
  style,
  ...props
}: CardInteractiveProps) {
  return (
    <Pressable
      className={twMerge(
        'w-full flex-row items-center gap-3.5 rounded-2xl border-2 p-4 transition-all active:translate-y-[2px] active:border-b-2',
        selected
          ? cardVariants.selected
          : 'border-b-4 border-line border-b-edge bg-surface active:bg-pressed',
        className,
      )}
      style={style}
      {...props}
    >
      {children}
    </Pressable>
  );
}

export function CardHeader({ className, ...props }: ViewProps) {
  return <View className={twMerge('mb-3 flex-col gap-1', className)} {...props} />;
}

export function CardTitle({ className, children, ...props }: React.ComponentProps<typeof Text>) {
  return (
    <Text className={twMerge('text-lg font-extrabold text-mascot-navy dark:text-white', className)} {...props}>
      {children}
    </Text>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Text>) {
  return (
    <Text
      className={twMerge('text-sm text-neutral-500 dark:text-neutral-400', className)}
      {...props}
    >
      {children}
    </Text>
  );
}

export function CardContent({ className, ...props }: ViewProps) {
  return <View className={twMerge('', className)} {...props} />;
}

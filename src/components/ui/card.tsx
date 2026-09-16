import type { PressableProps, ViewProps } from 'react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { twMerge } from 'tailwind-merge';

import { Text } from './text';

export type CardProps = ViewProps & {
  variant?: 'default' | 'elevated' | 'selected' | 'success' | 'flat';
};

export function Card({ className, variant = 'default', ...props }: CardProps) {
  const variantStyles = {
    default: 'border-2 border-neutral-200/90 border-b-[4px] border-b-neutral-300 bg-white dark:bg-neutral-800 dark:border-neutral-700 dark:border-b-neutral-900',
    elevated: 'border border-neutral-100 bg-white shadow-md shadow-neutral-200/50 dark:bg-neutral-800 dark:border-neutral-700',
    selected: 'bg-primary-50/80 border-2 border-primary-500 border-b-[4px] border-b-primary-600 dark:bg-neutral-800 dark:border-primary-400',
    success: 'bg-emerald-50 border-2 border-emerald-500 border-b-[4px] border-b-emerald-600 dark:bg-neutral-800',
    flat: 'border border-neutral-200 bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-700',
  };

  return (
    <View
      className={twMerge(
        'rounded-2xl p-4',
        variantStyles[variant],
        className,
      )}
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
  ...props
}: CardInteractiveProps) {
  return (
    <Pressable
      className={twMerge(
        'w-full flex-row items-center gap-3.5 rounded-2xl border-2 p-4 transition-all active:translate-y-[2px] active:border-b-2',
        selected
          ? 'border-b-4 border-primary-500 border-b-primary-600 bg-primary-50/80'
          : 'border-b-4 border-neutral-200/90 border-b-neutral-300 bg-white dark:border-neutral-700 dark:border-b-neutral-900 dark:bg-neutral-800',
        className,
      )}
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

export function CardDescription({ className, children, ...props }: React.ComponentProps<typeof Text>) {
  return (
    <Text className={twMerge('text-sm text-neutral-500 dark:text-neutral-400', className)} {...props}>
      {children}
    </Text>
  );
}

export function CardContent({ className, ...props }: ViewProps) {
  return <View className={twMerge('', className)} {...props} />;
}

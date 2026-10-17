import type { PressableProps, ViewProps } from 'react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { twMerge } from 'tailwind-merge';
import { useUniwind } from 'uniwind';

import { Text } from './text';

export type CardProps = ViewProps & {
  variant?: 'default' | 'elevated' | 'selected' | 'success' | 'flat';
};

export function Card({ className, variant = 'default', style, ...props }: CardProps) {
  const { theme } = useUniwind();
  const neutralSurfaceClasses = theme === 'dark'
    ? 'border-[#46505C] border-b-[#667382] bg-[#22252B]'
    : 'border-neutral-200/90 border-b-neutral-300 bg-white';
  const variantStyles = {
    default: `border-2 border-b-[4px] ${neutralSurfaceClasses}`,
    elevated: `border ${theme === 'dark' ? 'border-[#46505C] bg-[#22252B]' : 'border-neutral-100 bg-white shadow-md shadow-neutral-200/50'}`,
    selected: 'bg-primary-50/80 border-2 border-primary-500 border-b-[4px] border-b-primary-600 dark:bg-neutral-800 dark:border-primary-400',
    success: 'bg-emerald-50 border-2 border-emerald-500 border-b-[4px] border-b-emerald-600 dark:bg-neutral-800',
    flat: `border ${theme === 'dark' ? 'border-[#46505C] bg-[#22252B]' : 'border-neutral-200 bg-neutral-50'}`,
  };

  return (
    <View
      className={twMerge(
        'rounded-2xl p-4',
        variantStyles[variant],
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
  const { theme } = useUniwind();
  const neutralSurfaceClasses = theme === 'dark'
    ? 'border-[#46505C] border-b-[#667382] bg-[#22252B]'
    : 'border-neutral-200/90 border-b-neutral-300 bg-white';
  return (
    <Pressable
      className={twMerge(
        'w-full flex-row items-center gap-3.5 rounded-2xl border-2 p-4 transition-all active:translate-y-[2px] active:border-b-2',
        selected
          ? 'border-b-4 border-primary-500 border-b-primary-600 bg-primary-50/80'
          : `border-b-4 ${neutralSurfaceClasses}`,
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

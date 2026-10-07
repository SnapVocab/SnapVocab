import type { PressableProps, View } from 'react-native';
import type { TxKeyPath } from '@/lib/i18n';
import * as React from 'react';
import { Pressable, View as RNView, Text } from 'react-native';
import { twMerge } from 'tailwind-merge';
import { translate } from '@/lib/i18n';
import { BouncingDots } from './bouncing-dots';

export type ButtonVariant
  = | 'default'
    | 'brand'
    | 'primary'
    | 'purple'
    | 'secondary'
    | 'white'
    | 'info'
    | 'blue'
    | 'mascot'
    | 'orange'
    | 'reward'
    | 'gold'
    | 'destructive'
    | 'danger'
    | 'outline'
    | 'ghost';

export type ButtonSize = 'sm' | 'default' | 'lg' | 'icon';

export type ButtonProps = {
  label?: string;
  tx?: TxKeyPath;
  loading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  textClassName?: string;
  indicatorColor?: string;
  ref?: React.RefObject<View | null>;
} & Omit<PressableProps, 'disabled'>;

const variantStyles: Record<
  ButtonVariant,
  { container: string; text: string; indicator: string }
> = {
  default: {
    container: 'bg-primary-500 border-b-[4px] border-primary-700 active:translate-y-[2px] active:border-b-[2px]',
    text: 'text-white font-extrabold tracking-wider uppercase',
    indicator: '#ffffff',
  },
  brand: {
    container: 'bg-primary-500 border-b-[4px] border-primary-700 active:translate-y-[2px] active:border-b-[2px]',
    text: 'text-white font-extrabold tracking-wider uppercase',
    indicator: '#ffffff',
  },
  primary: {
    container: 'bg-primary-500 border-b-[4px] border-primary-700 active:translate-y-[2px] active:border-b-[2px]',
    text: 'text-white font-extrabold tracking-wider uppercase',
    indicator: '#ffffff',
  },
  purple: {
    container: 'bg-[#8253EC] border-b-[4px] border-[#5927C2] active:translate-y-[2px] active:border-b-[2px]',
    text: 'text-white font-extrabold tracking-wider uppercase',
    indicator: '#ffffff',
  },
  secondary: {
    container: 'bg-white border-2 border-neutral-200 border-b-[4px] border-b-neutral-300 active:translate-y-[2px] active:border-b-[2px]',
    text: 'text-neutral-800 font-extrabold tracking-wider uppercase',
    indicator: '#1E2A44',
  },
  white: {
    container: 'bg-white border-2 border-neutral-200 border-b-[4px] border-b-neutral-300 active:translate-y-[2px] active:border-b-[2px]',
    text: 'text-neutral-800 font-extrabold tracking-wider uppercase',
    indicator: '#1E2A44',
  },
  info: {
    container: 'bg-info-500 border-b-[4px] border-info-700 active:translate-y-[2px] active:border-b-[2px]',
    text: 'text-white font-extrabold tracking-wider uppercase',
    indicator: '#ffffff',
  },
  blue: {
    container: 'bg-info-500 border-b-[4px] border-info-700 active:translate-y-[2px] active:border-b-[2px]',
    text: 'text-white font-extrabold tracking-wider uppercase',
    indicator: '#ffffff',
  },
  mascot: {
    container: 'bg-mascot-500 border-b-[4px] border-mascot-700 active:translate-y-[2px] active:border-b-[2px]',
    text: 'text-white font-extrabold tracking-wider uppercase',
    indicator: '#ffffff',
  },
  orange: {
    container: 'bg-mascot-500 border-b-[4px] border-mascot-700 active:translate-y-[2px] active:border-b-[2px]',
    text: 'text-white font-extrabold tracking-wider uppercase',
    indicator: '#ffffff',
  },
  reward: {
    container: 'bg-reward-500 border-b-[4px] border-reward-700 active:translate-y-[2px] active:border-b-[2px]',
    text: 'text-white font-extrabold tracking-wider uppercase',
    indicator: '#ffffff',
  },
  gold: {
    container: 'bg-reward-500 border-b-[4px] border-reward-700 active:translate-y-[2px] active:border-b-[2px]',
    text: 'text-white font-extrabold tracking-wider uppercase',
    indicator: '#ffffff',
  },
  destructive: {
    container: 'bg-danger-500 border-b-[4px] border-danger-700 active:translate-y-[2px] active:border-b-[2px]',
    text: 'text-white font-extrabold tracking-wider uppercase',
    indicator: '#ffffff',
  },
  danger: {
    container: 'bg-danger-500 border-b-[4px] border-danger-700 active:translate-y-[2px] active:border-b-[2px]',
    text: 'text-white font-extrabold tracking-wider uppercase',
    indicator: '#ffffff',
  },
  outline: {
    container: 'bg-white border-2 border-primary-500 border-b-[4px] border-b-primary-700 active:translate-y-[2px] active:border-b-[2px]',
    text: 'text-primary-600 font-extrabold tracking-wider uppercase',
    indicator: '#58CC02',
  },
  ghost: {
    container: 'bg-transparent active:bg-neutral-100 dark:active:bg-neutral-800',
    text: 'text-neutral-700 dark:text-neutral-200 font-bold',
    indicator: '#757793',
  },
};

const sizeStyles: Record<ButtonSize, { container: string; text: string }> = {
  sm: {
    container: 'h-10 px-4 rounded-xl',
    text: 'text-xs',
  },
  default: {
    container: 'h-14 px-6 rounded-2xl',
    text: 'text-[15px]',
  },
  lg: {
    container: 'h-14 px-8 rounded-2xl',
    text: 'text-[16px]',
  },
  icon: {
    container: 'size-12 p-0 rounded-2xl',
    text: 'text-base',
  },
};

export function Button({
  ref,
  label,
  tx,
  children,
  loading = false,
  loadingText,
  variant = 'brand',
  disabled = false,
  size = 'default',
  fullWidth,
  icon,
  rightIcon,
  className = '',
  textClassName = '',
  indicatorColor,
  ...props
}: ButtonProps) {
  const isIcon = size === 'icon';
  const shouldFullWidth = fullWidth ?? !isIcon;

  const currentVariant = variantStyles[variant] ?? variantStyles.brand;
  const currentSize = sizeStyles[size] ?? sizeStyles.default;
  const isDisabled = disabled || loading;

  const resolvedText = tx ? translate(tx) : label;

  const containerClasses = twMerge(
    'flex-row items-center justify-center',
    currentSize.container,
    currentVariant.container,
    shouldFullWidth ? 'w-full' : 'self-center',
    disabled && !loading && 'opacity-50',
    loading && 'opacity-95',
    className,
  );

  const textClasses = twMerge(
    currentVariant.text,
    currentSize.text,
    'text-center',
    textClassName,
  );

  return (
    <Pressable
      ref={ref}
      disabled={isDisabled}
      className={containerClasses}
      // Keep the action's name while loading dots replace the text.
      accessibilityRole="button"
      accessibilityLabel={resolvedText}
      accessibilityState={{ disabled: isDisabled, busy: !!loading }}
      {...props}
    >
      {loading
        ? (
            <RNView className="flex-row items-center justify-center">
              <BouncingDots
                color={indicatorColor ?? currentVariant.indicator}
                size={size === 'sm' ? 6 : 8}
                gap={size === 'sm' ? 4 : 6}
                bounceHeight={size === 'sm' ? 5 : 7}
              />
              {loadingText
                ? (
                    <Text className={twMerge(textClasses, 'ml-3')}>
                      {loadingText}
                    </Text>
                  )
                : null}
            </RNView>
          )
        : children || (
          <>
            {/* The gap only separates icon from text; an icon-only button stays centred. */}
            {icon && <RNView className={resolvedText ? 'mr-2' : undefined}>{icon}</RNView>}
            {resolvedText && <Text className={textClasses}>{resolvedText}</Text>}
            {rightIcon && <RNView className={resolvedText ? 'ml-2' : undefined}>{rightIcon}</RNView>}
          </>
        )}
    </Pressable>
  );
}

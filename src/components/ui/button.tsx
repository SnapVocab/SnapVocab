import type { PressableProps, View } from 'react-native';
import type { TxKeyPath } from '@/lib/i18n';
import * as React from 'react';
import { Pressable, View as RNView, Text } from 'react-native';
import { twMerge } from 'tailwind-merge';
import { useUniwind } from 'uniwind';
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

type VariantStyle = {
  container: string;
  text: string;
  /** Loading-dot colors, matching the label in each mode. */
  indicator: { light: string; dark: string };
};

// The 3D press: GPU-only translateY avoids Yoga border-width layout reflow on Android.
const PRESS = 'border-b-[4px] active:translate-y-[2px]';
const LABEL = 'font-extrabold tracking-wider uppercase';

const LIGHT_SURFACE_VARIANTS = new Set<ButtonVariant>(['secondary', 'white', 'outline', 'ghost']);

// Dark mode keeps each hue but softens it: a lighter, less saturated face with a dark label,
// so a colored button reads as part of the dark UI instead of glowing on top of it.
const primary: VariantStyle = {
  // brand / brand-edge / on-brand are global.css tokens that already soften in dark mode.
  container: `${PRESS} bg-brand border-brand-edge active:bg-brand-pressed`,
  text: `${LABEL} text-on-brand`,
  indicator: { light: '#1B2416', dark: '#1B2416' },
};
const purple: VariantStyle = {
  container: `${PRESS} bg-purple-500 border-purple-700 active:bg-purple-600 dark:bg-[#A48BE6] dark:border-b-[#5D4A8E] dark:active:bg-[#977DDA]`,
  text: `${LABEL} text-white dark:text-[#1C1430]`,
  indicator: { light: '#ffffff', dark: '#1C1430' },
};
const neutral: VariantStyle = {
  container: `border-2 bg-surface border-line border-b-edge ${PRESS} active:bg-pressed`,
  text: `${LABEL} text-neutral-800 dark:text-neutral-50`,
  indicator: { light: '#1E2A44', dark: '#F3F4F6' },
};
const info: VariantStyle = {
  container: `${PRESS} bg-info-500 border-info-700 active:bg-info-600 dark:bg-[#6DB4DE] dark:border-b-[#3B6C89] dark:active:bg-[#60A6CF]`,
  text: `${LABEL} text-white dark:text-[#0E2330]`,
  indicator: { light: '#ffffff', dark: '#0E2330' },
};
const mascot: VariantStyle = {
  container: `${PRESS} bg-mascot-500 border-mascot-700 active:bg-mascot-600 dark:bg-[#E7A05C] dark:border-b-[#8A5A2B] dark:active:bg-[#D9924F]`,
  text: `${LABEL} text-white dark:text-[#2A1806]`,
  indicator: { light: '#ffffff', dark: '#2A1806' },
};
// Gold is too light for a white label in either mode; it always takes a dark brown one.
const reward: VariantStyle = {
  container: `${PRESS} bg-reward-500 border-reward-700 active:bg-reward-600 dark:bg-[#E6C25E] dark:border-b-[#8A6E22] dark:active:bg-[#D8B451]`,
  text: `${LABEL} text-[#4A3300] dark:text-[#2A2006]`,
  indicator: { light: '#4A3300', dark: '#2A2006' },
};
const danger: VariantStyle = {
  container: `${PRESS} bg-danger-500 border-danger-700 active:bg-danger-600 dark:bg-[#E07B7B] dark:border-b-[#8A3F3F] dark:active:bg-[#D26D6D]`,
  text: `${LABEL} text-white dark:text-[#2E0E0E]`,
  indicator: { light: '#ffffff', dark: '#2E0E0E' },
};

const variantStyles: Record<ButtonVariant, VariantStyle> = {
  default: primary,
  brand: primary,
  primary,
  purple,
  secondary: neutral,
  white: neutral,
  info,
  blue: info,
  mascot,
  orange: mascot,
  reward,
  gold: reward,
  destructive: danger,
  danger,
  outline: {
    container: `border-2 bg-surface border-primary-500 border-b-primary-700 dark:border-[#7FA35E] dark:border-b-[#557044] ${PRESS} active:bg-primary-50 dark:active:bg-pressed`,
    text: `${LABEL} text-primary-700 dark:text-[#B5D894]`,
    indicator: { light: '#3C8C00', dark: '#B5D894' },
  },
  ghost: {
    container: 'bg-transparent active:bg-pressed',
    text: 'text-neutral-700 dark:text-neutral-200 font-bold',
    indicator: { light: '#565879', dark: '#AEB4BE' },
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
  const colorMode = useUniwind().theme === 'dark' ? 'dark' : 'light';
  const isIcon = size === 'icon';
  const shouldFullWidth = fullWidth ?? !isIcon;

  const currentVariant = variantStyles[variant] ?? variantStyles.brand;
  const currentSize = sizeStyles[size] ?? sizeStyles.default;
  const isDisabled = disabled || loading;

  const resolvedText = tx ? translate(tx) : label;

  const containerClasses = twMerge(
    'flex-row items-center justify-center overflow-hidden',
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

  const defaultRipple = LIGHT_SURFACE_VARIANTS.has(variant)
    ? { color: colorMode === 'dark' ? 'rgba(243, 244, 246, 0.14)' : 'rgba(30, 42, 68, 0.10)', foreground: true }
    : { color: 'rgba(255, 255, 255, 0.22)', foreground: true };

  return (
    <Pressable
      ref={ref}
      disabled={isDisabled}
      android_ripple={props.android_ripple ?? defaultRipple}
      pressRetentionOffset={props.pressRetentionOffset ?? { top: 20, right: 20, bottom: 20, left: 20 }}
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
                color={indicatorColor ?? currentVariant.indicator[colorMode]}
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

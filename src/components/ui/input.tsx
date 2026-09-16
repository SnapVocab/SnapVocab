/* eslint-disable better-tailwindcss/no-unknown-classes */
import type { TextInputProps } from 'react-native';
import * as React from 'react';
import { I18nManager, TextInput as NTextInput, Pressable, StyleSheet, View } from 'react-native';
import { twMerge } from 'tailwind-merge';
import { tv } from 'tailwind-variants';

import colors from './colors';
import { Eye, EyeSlash } from './icons';
import { Text } from './text';

const inputTv = tv({
  slots: {
    container: 'mb-3',
    label: 'mb-1.5 text-sm font-bold text-mascot-navy dark:text-neutral-100',
    input:
      'font-inter h-14 rounded-2xl border-2 px-4 text-[15px] font-medium text-mascot-navy dark:text-neutral-100',
  },

  variants: {
    focused: {
      true: {
        input: 'border-primary-500 bg-white dark:border-primary-400 dark:bg-neutral-800',
      },
      false: {
        input: 'border-neutral-200 bg-neutral-50/60 dark:border-neutral-700 dark:bg-neutral-800',
      },
    },
    error: {
      true: {
        input: 'border-danger-500 bg-danger-50/20',
        label: 'text-danger-600',
      },
    },
    disabled: {
      true: {
        input: 'bg-neutral-200 dark:bg-neutral-700',
      },
    },
  },
  defaultVariants: {
    focused: false,
    error: false,
    disabled: false,
  },
});

export type NInputProps = {
  label?: string;
  disabled?: boolean;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
} & TextInputProps;

export function Input({ ref, ...props }: NInputProps & { ref?: React.Ref<NTextInput | null> }) {
  const {
    label,
    error,
    hint,
    testID,
    onBlur: onBlurProp,
    onFocus: onFocusProp,
    icon,
    rightIcon,
    isPassword = false,
    secureTextEntry,
    className,
    ...inputProps
  } = props;
  const [isFocussed, setIsFocussed] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const onBlur = React.useCallback(
    (e: any) => {
      setIsFocussed(false);
      onBlurProp?.(e);
    },
    [onBlurProp],
  );

  const onFocus = React.useCallback(
    (e: any) => {
      setIsFocussed(true);
      onFocusProp?.(e);
    },
    [onFocusProp],
  );

  const styles = inputTv({
    error: Boolean(error),
    focused: isFocussed,
    disabled: Boolean(props.disabled),
  });

  const effectiveSecure = isPassword ? !showPassword : secureTextEntry;

  const effectiveRightIcon = isPassword
    ? (
        <Pressable
          onPress={() => setShowPassword(prev => !prev)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword
            ? (
                <EyeSlash color={colors.neutral[400]} />
              )
            : (
                <Eye color={colors.neutral[400]} />
              )}
        </Pressable>
      )
    : (
        rightIcon
      );

  return (
    <View className={styles.container()}>
      {label && (
        <Text
          testID={testID ? `${testID}-label` : undefined}
          className={styles.label()}
        >
          {label}
        </Text>
      )}
      <View className="relative">
        {icon && (
          <View className="absolute inset-y-0 left-4 z-10 justify-center">
            {icon}
          </View>
        )}
        {effectiveRightIcon && (
          <View className="absolute inset-y-0 right-4 z-10 justify-center">
            {effectiveRightIcon}
          </View>
        )}
        <NTextInput
          testID={testID}
          ref={ref}
          placeholderTextColor={colors.neutral[400]}
          secureTextEntry={effectiveSecure}
          className={styles.input({
            className: twMerge(
              icon ? 'pl-12' : '',
              effectiveRightIcon ? 'pr-12' : '',
              className ?? '',
            ),
          })}
          onBlur={onBlur}
          onFocus={onFocus}
          {...inputProps}
          style={StyleSheet.flatten([
            { writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr' },
            { textAlign: I18nManager.isRTL ? 'right' : 'left' },
            inputProps.style,
          ])}
        />
      </View>
      {error
        ? (
            <Text
              testID={testID ? `${testID}-error` : undefined}
              className="mt-1.5 px-1 text-sm font-medium text-danger-500 dark:text-danger-600"
            >
              {error}
            </Text>
          )
        : hint
          ? (
              <Text className="mt-1.5 px-1 text-xs text-neutral-400">
                {hint}
              </Text>
            )
          : null}
    </View>
  );
}

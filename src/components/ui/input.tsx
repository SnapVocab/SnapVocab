/* eslint-disable better-tailwindcss/no-unknown-classes */
import type { TextInputProps } from 'react-native';
import * as React from 'react';
import { I18nManager, TextInput as NTextInput, StyleSheet, View } from 'react-native';
import { twMerge } from 'tailwind-merge';
import { tv } from 'tailwind-variants';

import colors from './colors';
import { Text } from './text';

const inputTv = tv({
  slots: {
    container: 'mb-2',
    label: 'mb-1 text-lg text-neutral-800 dark:text-neutral-100',
    input:
      'font-inter mt-0 rounded-2xl border-2 px-4 py-3 text-base/6 font-medium text-neutral-800 dark:text-neutral-100',
  },

  variants: {
    focused: {
      true: {
        input: 'border-primary-500 bg-white dark:border-primary-400 dark:bg-neutral-800',
      },
      false: {
        input: 'border-neutral-300 bg-neutral-50 dark:border-neutral-500 dark:bg-neutral-800',
      },
    },
    error: {
      true: {
        input: 'border-danger-600',
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
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
} & TextInputProps;

export function Input({ ref, ...props }: NInputProps & { ref?: React.Ref<NTextInput | null> }) {
  const { label, error, testID, onBlur: onBlurProp, onFocus: onFocusProp, icon, rightIcon, className, ...inputProps } = props;
  const [isFocussed, setIsFocussed] = React.useState(false);

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
        {rightIcon && (
          <View className="absolute inset-y-0 right-4 z-10 justify-center">
            {rightIcon}
          </View>
        )}
        <NTextInput
          testID={testID}
          ref={ref}
          placeholderTextColor={colors.neutral[400]}
          className={styles.input({
            className: twMerge(
              icon ? 'pl-12' : '',
              rightIcon ? 'pr-12' : '',
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
      {error && (
        <Text
          testID={testID ? `${testID}-error` : undefined}
          className="text-sm text-danger-400 dark:text-danger-600"
        >
          {error}
        </Text>
      )}
    </View>
  );
}

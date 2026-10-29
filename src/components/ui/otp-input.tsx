import type { NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import * as React from 'react';
import { useCallback, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { twMerge } from 'tailwind-merge';

const CELL_COUNT = 6;

export type OtpInputProps = {
  value: string;
  onChange: (code: string) => void;
  /** Disable all cells (e.g. after max attempts) */
  disabled?: boolean;
  /** Show error styling on cells */
  hasError?: boolean;
  /** Number of digits (default: 6) */
  cellCount?: number;
};

export function OtpInput({
  value,
  onChange,
  disabled = false,
  hasError = false,
  cellCount = CELL_COUNT,
}: OtpInputProps) {
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const digits = value
    .split('')
    .concat(Array.from({ length: cellCount }, () => ''))
    .slice(0, cellCount);

  const focusCell = useCallback(
    (index: number) => {
      if (index >= 0 && index < cellCount) {
        inputRefs.current[index]?.focus();
      }
    },
    [cellCount],
  );

  const handleChange = useCallback(
    (text: string, index: number) => {
      // Handle paste – user pastes full OTP code
      if (text.length > 1) {
        const pasted = text.replace(/\D/g, '').slice(0, cellCount);
        onChange(pasted);
        focusCell(Math.min(pasted.length, cellCount - 1));
        return;
      }

      const digit = text.replace(/\D/g, '');
      const arr = value.split('');

      if (digit) {
        arr[index] = digit;
        const newValue = arr.join('').slice(0, cellCount);
        onChange(newValue);
        // Auto-advance to next cell
        if (index < cellCount - 1) {
          focusCell(index + 1);
        }
      }
    },
    [value, onChange, focusCell, cellCount],
  );

  const handleKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
      if (e.nativeEvent.key === 'Backspace') {
        const arr = value.split('');
        if (arr[index]) {
          // Clear current cell
          arr[index] = '';
          onChange(arr.join(''));
        }
        else if (index > 0) {
          // Go back to previous cell and clear it
          arr[index - 1] = '';
          onChange(arr.join(''));
          focusCell(index - 1);
        }
      }
    },
    [value, onChange, focusCell],
  );

  return (
    <View className="flex-row justify-center gap-2.5">
      {digits.map((digit, i) => {
        const isFocused = focusedIndex === i;
        const isFilled = Boolean(digit);

        let cellStyle
          = 'border-line border-b-[3px] border-b-edge bg-neutral-50/80 dark:bg-neutral-800';

        if (hasError) {
          cellStyle
            = 'border-danger-500 border-b-[3px] border-b-danger-700 bg-danger-50/50 dark:border-danger-500 dark:bg-danger-500/15';
        }
        else if (isFocused) {
          cellStyle
            = 'border-info-500 border-b-[3px] border-b-info-700 bg-white dark:border-info-400 dark:bg-neutral-800';
        }
        else if (isFilled) {
          cellStyle
            = 'border-primary-500 border-b-[3px] border-b-primary-700 bg-primary-50/40 dark:border-primary-500 dark:bg-primary-500/15';
        }

        return (
          <View
            key={i}
            className={twMerge(
              'h-14 w-12 items-center justify-center overflow-hidden rounded-2xl border-2',
              cellStyle,
            )}
          >
            <TextInput
              ref={(ref) => {
                inputRefs.current[i] = ref;
              }}
              value={digit}
              onChangeText={text => handleChange(text, i)}
              onKeyPress={e => handleKeyPress(e, i)}
              onFocus={() => setFocusedIndex(i)}
              onBlur={() => setFocusedIndex(-1)}
              keyboardType="number-pad"
              maxLength={i === 0 ? cellCount : 1}
              editable={!disabled}
              selectTextOnFocus
              className="size-full text-center text-2xl font-bold text-mascot-navy dark:text-neutral-100"
              accessibilityLabel={`OTP digit ${i + 1}`}
            />
          </View>
        );
      })}
    </View>
  );
}

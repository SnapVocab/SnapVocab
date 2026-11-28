/* eslint-disable react-refresh/only-export-components */
import type { AxiosError } from 'axios';
import { Dimensions, Platform } from 'react-native';
import { translate } from '@/lib/i18n';
import { showToast } from './popup/popup-store';

export const IS_IOS = Platform.OS === 'ios';
const { width, height } = Dimensions.get('screen');

export const WIDTH = width;
export const HEIGHT = height;

// for onError react queries and mutations
export function showError(error: AxiosError) {
  console.log(JSON.stringify(error?.response?.data));
  const description = extractError(error?.response?.data).trim();
  showToast('error', translate('popup.error_title'), description || undefined);
}

/** Popup after an action went through, e.g. "Cập nhật hồ sơ thành công". */
export function showSuccessMessage(message: string) {
  showToast('success', message);
}

export function showErrorMessage(message?: string) {
  showToast('error', message || translate('popup.generic_error'));
}

export function showInfoMessage(message: string) {
  showToast('info', message);
}

export function extractError(data: unknown): string {
  if (typeof data === 'string') {
    return data;
  }
  if (Array.isArray(data)) {
    const messages = data.map((item) => {
      return `  ${extractError(item)}`;
    });

    return `${messages.join('')}`;
  }

  if (typeof data === 'object' && data !== null) {
    const messages = Object.entries(data).map((item) => {
      const [key, value] = item;
      const separator = Array.isArray(value) ? ':\n ' : ': ';

      return `- ${key}${separator}${extractError(value)} \n `;
    });
    return `${messages.join('')} `;
  }
  return translate('popup.generic_error');
}

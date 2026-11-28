import type * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import { create } from 'zustand';
import { translate } from '@/lib/i18n';

export type PopupKind = 'success' | 'error' | 'info' | 'warning';

export type PopupIcon = React.ComponentType<SvgProps & { size?: number }>;

/** A short message after an action: closes by itself or on any tap. */
export type ToastPopup = {
  id: number;
  kind: Exclude<PopupKind, 'warning'>;
  title: string;
  message?: string;
};

/** Same shape as React Native's Alert buttons, so call sites read the same. */
export type DialogButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

export type DialogOptions = {
  /** Back / tapping outside closes the dialog even without a cancel button. */
  cancelable?: boolean;
  kind?: PopupKind;
  icon?: PopupIcon;
};

/** A question or a blocking notice: stays until the learner picks a button. */
export type DialogPopup = {
  id: number;
  kind: PopupKind;
  title: string;
  message?: string;
  buttons: DialogButton[];
  cancelable: boolean;
  icon?: PopupIcon;
};

type PopupState = {
  toast: ToastPopup | null;
  /** Shown one at a time, in order. */
  dialogs: DialogPopup[];
};

export const usePopupStore = create<PopupState>(() => ({ toast: null, dialogs: [] }));

let nextId = 1;

/** A newer message replaces the one on screen. */
export function showToast(kind: ToastPopup['kind'], title: string, message?: string) {
  usePopupStore.setState({ toast: { id: nextId++, kind, title, message } });
}

/** Without an id, closes whatever message is showing. */
export function hideToast(id?: number) {
  usePopupStore.setState(state =>
    state.toast && (id === undefined || state.toast.id === id) ? { toast: null } : state);
}

export type DialogRequest = DialogOptions & {
  title: string;
  message?: string;
  /** Omitted: a single "OK". */
  buttons?: DialogButton[];
};

/** `Alert.alert` in the app's own style. */
export function showDialog({ title, message, buttons, cancelable, kind, icon }: DialogRequest) {
  const list = buttons?.length ? buttons : [{ text: translate('popup.ok') }];
  const dialog: DialogPopup = {
    id: nextId++,
    kind: kind ?? (list.some(button => button.style === 'destructive') ? 'warning' : 'info'),
    title,
    message,
    buttons: list,
    cancelable: cancelable ?? !buttons?.length,
    icon,
  };
  usePopupStore.setState(state => ({ dialogs: [...state.dialogs, dialog] }));
}

export function closeDialog(id: number) {
  usePopupStore.setState(state => ({ dialogs: state.dialogs.filter(dialog => dialog.id !== id) }));
}

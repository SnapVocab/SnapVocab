import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as React from 'react';
import i18n from '@/lib/i18n';
import { showErrorMessage, showSuccessMessage } from '../utils';
import { PopupHost } from './popup-host';
import { orderButtons, TOAST_DURATION } from './popup-rules';
import { showDialog, usePopupStore } from './popup-store';

beforeAll(async () => {
  await i18n.changeLanguage('vi');
});

beforeEach(() => {
  act(() => usePopupStore.setState({ toast: null, dialogs: [] }));
});

afterEach(() => {
  jest.useRealTimers();
});

describe('message popup', () => {
  it('shows a success message in the middle and closes it by itself', () => {
    jest.useFakeTimers();
    render(<PopupHost />);
    act(() => showSuccessMessage('Cập nhật hồ sơ thành công'));
    expect(screen.getByText('Cập nhật hồ sơ thành công')).toBeOnTheScreen();
    expect(screen.getByText('Chạm để đóng')).toBeOnTheScreen();

    act(() => jest.advanceTimersByTime(TOAST_DURATION.success));
    expect(usePopupStore.getState().toast).toBeNull();
    expect(screen.queryByText('Cập nhật hồ sơ thành công')).toBeNull();
  });

  it('closes on a tap anywhere on the screen', () => {
    render(<PopupHost />);
    act(() => showSuccessMessage('Đã lưu'));
    fireEvent.press(screen.getByTestId('popup-toast-backdrop'));
    expect(usePopupStore.getState().toast).toBeNull();
  });

  it('keeps an error longer, offers "Đóng", and never shows an empty message', () => {
    jest.useFakeTimers();
    render(<PopupHost />);
    act(() => showErrorMessage());
    expect(screen.getByText('Đã có lỗi xảy ra. Bạn thử lại nhé.')).toBeOnTheScreen();

    act(() => jest.advanceTimersByTime(TOAST_DURATION.success));
    expect(usePopupStore.getState().toast).not.toBeNull();
    fireEvent.press(screen.getByTestId('popup-toast-close'));
    expect(usePopupStore.getState().toast).toBeNull();
  });

  it('lets a newer message replace the one on screen', () => {
    render(<PopupHost />);
    act(() => showSuccessMessage('Một'));
    act(() => showErrorMessage('Hai'));
    expect(screen.queryByText('Một')).toBeNull();
    expect(screen.getByText('Hai')).toBeOnTheScreen();
  });
});

describe('dialog popup', () => {
  const logout = jest.fn();
  const cancel = jest.fn();
  const ask = () => showDialog({
    title: 'Đăng xuất?',
    message: 'Bạn sẽ cần đăng nhập lại.',
    buttons: [
      { text: 'Huỷ', style: 'cancel', onPress: cancel },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ],
  });

  beforeEach(() => jest.clearAllMocks());

  it('runs the chosen button and closes', () => {
    render(<PopupHost />);
    act(ask);
    expect(screen.getByText('Bạn sẽ cần đăng nhập lại.')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('Đăng xuất'));
    expect(logout).toHaveBeenCalledTimes(1);
    expect(cancel).not.toHaveBeenCalled();
    expect(usePopupStore.getState().dialogs).toHaveLength(0);
  });

  it('treats a tap outside as the cancel button', () => {
    render(<PopupHost />);
    act(ask);
    fireEvent.press(screen.getByTestId('popup-dialog-backdrop', { includeHiddenElements: true }));
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(logout).not.toHaveBeenCalled();
  });

  it('stays until a button is picked when there is nothing to cancel', () => {
    const restart = jest.fn();
    render(<PopupHost />);
    act(() => showDialog({ title: 'Phiên đã hết hạn', buttons: [{ text: 'Tạo quiz mới', onPress: restart }] }));
    fireEvent.press(screen.getByTestId('popup-dialog-backdrop', { includeHiddenElements: true }));
    expect(usePopupStore.getState().dialogs).toHaveLength(1);
    fireEvent.press(screen.getByText('Tạo quiz mới'));
    expect(restart).toHaveBeenCalledTimes(1);
  });

  it('gives a plain notice a single "OK" that a tap outside also closes', () => {
    render(<PopupHost />);
    act(() => showDialog({ title: 'Đã hết lượt học hôm nay' }));
    expect(screen.getByText('OK')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('popup-dialog-backdrop', { includeHiddenElements: true }));
    expect(usePopupStore.getState().dialogs).toHaveLength(0);
  });

  it('shows dialogs one after another', () => {
    render(<PopupHost />);
    act(() => {
      showDialog({ title: 'Thứ nhất' });
      showDialog({ title: 'Thứ hai' });
    });
    expect(screen.queryByText('Thứ hai')).toBeNull();
    fireEvent.press(screen.getByText('OK'));
    expect(screen.getByText('Thứ hai')).toBeOnTheScreen();
  });

  it('puts the main action first and cancel last', () => {
    const order = orderButtons([
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Tiếp tục bài cũ' },
      { text: 'Tạo bài mới', style: 'destructive' },
    ]).map(({ button, variant }) => [button.text, variant]);
    expect(order).toEqual([['Tiếp tục bài cũ', 'primary'], ['Tạo bài mới', 'secondary'], ['Huỷ', 'ghost']]);
    expect(orderButtons([{ text: 'Huỷ', style: 'cancel' }, { text: 'Xoá', style: 'destructive' }])[0]!.variant).toBe('danger');
  });
});

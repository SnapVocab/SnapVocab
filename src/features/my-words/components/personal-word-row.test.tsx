import { fireEvent, render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { useSetMyWord } from '../api';
import { PersonalWordRow } from './personal-word-row';

const mockDialog = jest.fn();
jest.mock('../api', () => ({ useSetMyWord: jest.fn() }));
jest.mock('@/lib/i18n', () => ({ translate: (key: string) => key }));
jest.mock('@/components/ui/surface', () => ({ useColorMode: () => 'light' }));
jest.mock('@/components/ui/icons', () => ({ BookIcon: () => null, FolderIcon: () => null, MoreVerticalIcon: () => null }));
jest.mock('@/components/ui', () => {
  const RN = require('react-native');
  return { View: RN.View, Pressable: RN.Pressable, Text: RN.Text, showDialog: (...args: unknown[]) => mockDialog(...args), showErrorMessage: jest.fn(), showSuccessMessage: jest.fn() };
});

it('separates opening a word from choosing its destination', () => {
  const onOpen = jest.fn();
  const onAdd = jest.fn();
  jest.mocked(useSetMyWord).mockReturnValue({ mutate: jest.fn(), isPending: false } as unknown as ReturnType<typeof useSetMyWord>);
  render(<PersonalWordRow word={{ id: 10, word: 'mug' }} onOpen={onOpen} onAdd={onAdd} />);
  fireEvent.press(screen.getByTestId('my-word-10'));
  expect(onOpen).toHaveBeenCalledTimes(1);
  expect(onAdd).not.toHaveBeenCalled();
  fireEvent.press(screen.getByTestId('my-word-add-10'));
  expect(onAdd).toHaveBeenCalledTimes(1);
});

it('only removes a word after choosing the destructive menu action', () => {
  const mutate = jest.fn();
  jest.mocked(useSetMyWord).mockReturnValue({ mutate, isPending: false } as unknown as ReturnType<typeof useSetMyWord>);
  render(<PersonalWordRow word={{ id: 10, word: 'mug' }} onOpen={jest.fn()} onAdd={jest.fn()} />);
  fireEvent.press(screen.getByTestId('my-word-options-10'));
  expect(mutate).not.toHaveBeenCalled();
  expect(mockDialog.mock.calls[0][0]).toEqual(expect.objectContaining({ cancelable: true }));
  const remove = (mockDialog.mock.calls[0][0].buttons as { style?: string; onPress?: () => void }[]).find(button => button.style === 'destructive');
  remove?.onPress?.();
  expect(mutate).toHaveBeenCalledWith({ wordId: 10, saved: false }, expect.any(Object));
});

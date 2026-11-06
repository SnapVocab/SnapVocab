import { fireEvent, render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { Alert } from 'react-native';
import { useSetMyWord } from '../api';
import { PersonalWordRow } from './personal-word-row';

jest.mock('../api', () => ({ useSetMyWord: jest.fn() }));
jest.mock('@/lib/i18n', () => ({ translate: (key: string) => key }));
jest.mock('@/components/ui/surface', () => ({ useColorMode: () => 'light' }));
jest.mock('@/components/ui/icons', () => ({ BookIcon: () => null, FolderIcon: () => null, MoreVerticalIcon: () => null }));
jest.mock('@/components/ui', () => {
  const RN = require('react-native');
  return { View: RN.View, Pressable: RN.Pressable, Text: RN.Text, showErrorMessage: jest.fn(), showSuccessMessage: jest.fn() };
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
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  jest.mocked(useSetMyWord).mockReturnValue({ mutate, isPending: false } as unknown as ReturnType<typeof useSetMyWord>);
  render(<PersonalWordRow word={{ id: 10, word: 'mug' }} onOpen={jest.fn()} onAdd={jest.fn()} />);
  fireEvent.press(screen.getByTestId('my-word-options-10'));
  expect(mutate).not.toHaveBeenCalled();
  expect(alert.mock.calls[0][3]).toEqual({ cancelable: true });
  const remove = alert.mock.calls[0][2]?.find(button => button.style === 'destructive');
  remove?.onPress?.();
  expect(mutate).toHaveBeenCalledWith({ wordId: 10, saved: false }, expect.any(Object));
  alert.mockRestore();
});

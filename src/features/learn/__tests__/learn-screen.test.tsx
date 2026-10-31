import { fireEvent, render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { LearnScreen } from '../learn-screen';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('lucide-react-native', () => ({
  BookOpenIcon: () => null,
  ChevronRightIcon: () => null,
  ListChecksIcon: () => null,
  ArrowRightIcon: () => null,
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@/components/ui', () => ({
  View: require('react-native').View,
  Text: require('react-native').Text,
  FocusAwareStatusBar: () => null,
  useSurface: () => ({ background: '#F7F8FA', headerBg: '#FFFFFF' }),
}));
jest.mock('@/lib/i18n', () => ({
  translate: (key: string) => key.split('.').reduce<any>((copy, part) => copy[part], require('@/translations/en.json')),
}));

it('opens the existing collection and quiz screens from Learn', () => {
  render(<LearnScreen />);
  fireEvent.press(screen.getByRole('button', { name: 'Collections' }));
  expect(mockPush).toHaveBeenLastCalledWith('/collections');
  fireEvent.press(screen.getByRole('button', { name: 'Quiz' }));
  expect(mockPush).toHaveBeenLastCalledWith('/study/quiz-setup');
});

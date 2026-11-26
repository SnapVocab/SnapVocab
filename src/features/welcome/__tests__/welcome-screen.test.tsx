import { fireEvent, render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { WelcomeScreen } from '../welcome-screen';

const mockReplace = jest.fn();
let mockSeen = false;
const mockMarkSeen = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  Redirect: ({ href }: { href: string }) => {
    const { Text } = require('react-native');
    return <Text>{`redirect:${href}`}</Text>;
  },
}));
jest.mock('../seen', () => ({
  hasSeenWelcome: () => mockSeen,
  markWelcomeSeen: () => mockMarkSeen(),
}));
jest.mock('@/lib/i18n/utils', () => ({ translate: (key: string) => key }));
jest.mock('react-native-gesture-handler', () => ({
  Gesture: { Pan: () => ({ onEnd: () => ({}) }) },
  GestureDetector: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@/components/ui', () => {
  const RN = require('react-native');
  return {
    SafeAreaView: RN.View,
    FocusAwareStatusBar: () => null,
    Image: () => null,
    Text: RN.Text,
    Button: ({ label, onPress, testID }: { label: string; onPress: () => void; testID?: string }) => (
      <RN.Pressable testID={testID} onPress={onPress}><RN.Text>{label}</RN.Text></RN.Pressable>
    ),
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  mockSeen = false;
});

it('goes straight to Login once the onboarding has been seen', () => {
  mockSeen = true;
  render(<WelcomeScreen />);
  expect(screen.getByText('redirect:/(auth)/login')).toBeOnTheScreen();
});

it('skipping marks the slides seen and opens Login', () => {
  render(<WelcomeScreen />);
  fireEvent.press(screen.getByTestId('welcome-skip'));
  expect(mockMarkSeen).toHaveBeenCalled();
  expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
});

it('the last slide offers Register and Login, and hides Skip', () => {
  render(<WelcomeScreen />);
  fireEvent.press(screen.getByTestId('welcome-next'));
  fireEvent.press(screen.getByTestId('welcome-next'));
  expect(screen.queryByTestId('welcome-skip')).toBeNull();
  fireEvent.press(screen.getByTestId('welcome-register'));
  expect(mockMarkSeen).toHaveBeenCalled();
  expect(mockReplace).toHaveBeenCalledWith('/(auth)/register');
  fireEvent.press(screen.getByTestId('welcome-login'));
  expect(mockReplace).toHaveBeenLastCalledWith('/(auth)/login');
});

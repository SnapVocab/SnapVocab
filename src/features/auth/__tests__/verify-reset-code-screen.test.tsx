import { fireEvent, render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { useForgotPassword, useVerifyResetCode } from '../api';
import { VerifyResetCodeScreen } from '../verify-reset-code-screen';

const mockPush = jest.fn();
const mockError = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => ({ email: 'learner@example.com' }),
}));
jest.mock('../api', () => ({ useVerifyResetCode: jest.fn(), useForgotPassword: jest.fn() }));
jest.mock('@/lib/i18n', () => ({ translate: (key: string) => key }));
jest.mock('react-native-keyboard-controller', () => ({ KeyboardAvoidingView: require('react-native').View }));
jest.mock('@/components/ui/mascot', () => ({ Mascot: () => null }));
jest.mock('@/components/ui', () => {
  const RN = require('react-native');
  return {
    SafeAreaView: RN.View,
    FocusAwareStatusBar: () => null,
    Text: RN.Text,
    OtpInput: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
      <RN.TextInput testID="otp" value={value} onChangeText={onChange} />
    ),
    Button: ({ label, onPress, disabled, testID }: { label: string; onPress: () => void; disabled?: boolean; testID?: string }) => (
      <RN.Pressable testID={testID} onPress={onPress} disabled={disabled}><RN.Text>{label}</RN.Text></RN.Pressable>
    ),
    showErrorMessage: (message: string) => mockError(message),
    showSuccessMessage: jest.fn(),
  };
});

let verifyOutcome: 'ok' | 400 | 'offline' = 'ok';
const mockVerify = jest.fn((_vars: unknown, callbacks: { onSuccess: () => void; onError: (e: unknown) => void }) => {
  if (verifyOutcome === 'ok')
    callbacks.onSuccess();
  else
    callbacks.onError(verifyOutcome === 400 ? { response: { status: 400 } } : new Error('offline'));
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useVerifyResetCode).mockReturnValue({ mutate: mockVerify, isPending: false } as unknown as ReturnType<typeof useVerifyResetCode>);
  jest.mocked(useForgotPassword).mockReturnValue({ mutate: jest.fn(), isPending: false } as unknown as ReturnType<typeof useForgotPassword>);
});

it('a valid code goes on to the new password', () => {
  verifyOutcome = 'ok';
  render(<VerifyResetCodeScreen />);
  fireEvent.changeText(screen.getByTestId('otp'), '123456');
  fireEvent.press(screen.getByTestId('verify-reset-code-submit'));
  expect(mockVerify).toHaveBeenCalledWith({ email: 'learner@example.com', code: '123456' }, expect.anything());
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/(auth)/reset-password', params: { email: 'learner@example.com', code: '123456' } });
});

it('a wrong code is said here, before any password is typed', () => {
  verifyOutcome = 400;
  render(<VerifyResetCodeScreen />);
  fireEvent.changeText(screen.getByTestId('otp'), '000000');
  fireEvent.press(screen.getByTestId('verify-reset-code-submit'));
  expect(mockPush).not.toHaveBeenCalled();
  expect(mockError).toHaveBeenCalledWith('verify_reset_code.wrong_or_expired');
});

it('a network failure is not called a wrong code', () => {
  verifyOutcome = 'offline';
  render(<VerifyResetCodeScreen />);
  fireEvent.changeText(screen.getByTestId('otp'), '123456');
  fireEvent.press(screen.getByTestId('verify-reset-code-submit'));
  expect(mockError).toHaveBeenCalledWith('verify_reset_code.network_error');
});

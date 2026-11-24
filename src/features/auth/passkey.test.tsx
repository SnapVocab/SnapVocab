/* eslint-disable react/no-unnecessary-use-prefix -- Test mocks match production hook names. */
import { jest } from '@jest/globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { storage } from '@/lib/storage';
import { LoginForm } from './components/login-form';
import {
  clearStoredPasskeyBinding,
  getLastLoginEmail,
  getStoredPasskeyBinding,
  isPasskeyCancelledError,
  setLastLoginEmail,
  setStoredPasskeyBinding,
} from './passkey';

const mockPasskeyLogin = jest.fn();
const mockPasswordLogin = jest.fn();
const mockSetAuth = jest.fn();

jest.mock('env', () => ({ __esModule: true, default: { EXPO_PUBLIC_API_URL: 'http://localhost:8080' } }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('uniwind', () => ({
  useUniwind: () => ({ theme: 'light' }),
  withUniwind: (component: unknown) => component,
}));
jest.mock('@/components/ui', () => {
  const RN = require('react-native');
  return {
    View: RN.View,
    Input: (props: { value?: string; onChangeText?: (text: string) => void }) => (
      <RN.TextInput value={props.value} onChangeText={props.onChangeText} />
    ),
    Button: (props: { testID?: string; label?: string; onPress?: () => void }) => (
      <RN.Pressable testID={props.testID} onPress={props.onPress}>
        <RN.Text>{props.label ?? ''}</RN.Text>
      </RN.Pressable>
    ),
    ThemedLink: ({ children }: { children?: React.ReactNode }) => children ?? null,
    showErrorMessage: jest.fn(),
  };
});
jest.mock('@/components/ui/icons', () => ({
  FingerprintIcon: () => null,
  Lock: () => null,
  Mail: () => null,
}));
jest.mock('./use-auth-store', () => ({
  store: { subscribe: jest.fn() },
  useAuthStore: (selector: (s: { login: typeof mockSetAuth }) => unknown) =>
    selector({ login: mockSetAuth }),
}));
jest.mock('./api', () => ({
  useLogin: () => ({ mutate: mockPasswordLogin, isPending: false }),
}));
jest.mock('./passkey', () => {
  const actual = jest.requireActual<Record<string, unknown>>('./passkey');
  return {
    ...actual,
    useBiometricSupported: () => true,
    usePasskeyLogin: () => ({ mutate: mockPasskeyLogin, isPending: false }),
  };
});

let deviceValues: Map<string, string>;

beforeEach(() => {
  jest.clearAllMocks();
  deviceValues = new Map();
  jest.mocked(storage.getString).mockImplementation(key => deviceValues.get(key));
  jest.mocked(storage.set).mockImplementation((key, value) => {
    deviceValues.set(key, String(value));
  });
  jest.mocked(storage.remove).mockImplementation((key) => {
    return deviceValues.delete(key);
  });
});

afterEach(() => {
  cleanup();
});

it('stores and clears passkey binding and last login email', () => {
  setLastLoginEmail('  learner@example.com  ');
  expect(getLastLoginEmail()).toBe('learner@example.com');

  setStoredPasskeyBinding({
    dbId: 12,
    credentialId: 'cred-xyz',
    email: 'learner@example.com',
  });
  expect(getStoredPasskeyBinding()).toEqual({
    dbId: 12,
    credentialId: 'cred-xyz',
    email: 'learner@example.com',
  });

  clearStoredPasskeyBinding();
  expect(getStoredPasskeyBinding()).toBeNull();
});

it('detects cancelled passkey errors', () => {
  expect(isPasskeyCancelledError({ error: 'UserCancelled', message: 'User cancelled' })).toBe(true);
  expect(isPasskeyCancelledError({ error: 'RequestFailed', message: 'Network error' })).toBe(false);
});

it('renders fingerprint button beside login button and triggers passkey login with saved email', () => {
  deviceValues.set('passkey_last_email', 'saved@example.com');
  deviceValues.set('passkey_device_binding', JSON.stringify({
    dbId: 12,
    credentialId: 'bio:cred-1',
    email: 'saved@example.com',
  }));
  render(<LoginForm />);

  const biometricBtn = screen.getByTestId('login-biometric-button');
  fireEvent.press(biometricBtn);

  expect(mockPasskeyLogin).toHaveBeenCalledWith(
    { email: 'saved@example.com' },
    expect.objectContaining({
      onSuccess: expect.any(Function),
      onError: expect.any(Function),
    }),
  );
});

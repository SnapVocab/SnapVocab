/* eslint-disable react/no-unnecessary-use-prefix -- Test mocks match production hook names. */
import { jest } from '@jest/globals';
import { cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react-native';
import i18n from 'i18next';
import { useMMKVString } from 'react-native-mmkv';
import RNRestart from 'react-native-restart';
import { Uniwind } from 'uniwind';
import { loadSelectedTheme, useSelectedTheme } from '@/lib/hooks/use-selected-theme';
import { getLanguage, translate, useSelectedLanguage } from '@/lib/i18n';
import { storage } from '@/lib/storage';
import { SettingsScreen } from './settings-screen';

const mockMutate = jest.fn();
const mockPush = jest.fn();
jest.mock('env', () => ({ __esModule: true, default: { EXPO_PUBLIC_VERSION: '0.0.1' } }));
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn(), push: mockPush }) }));
jest.mock('uniwind', () => ({ Uniwind: { setTheme: jest.fn() } }));
jest.mock('react-native-restart', () => ({ __esModule: true, default: { restart: jest.fn() } }));
jest.mock('./api', () => ({
  useUserSettings: () => ({
    data: { pushEnabled: true },
  }),
  useUpdateSettings: () => ({ mutate: mockMutate }),
  useLogout: () => ({ mutate: jest.fn() }),
}));
jest.mock('./use-icon-colors', () => ({ useIconColors: () => ({ row: {}, danger: 'red' }) }));
jest.mock('@/components/ui/icons', () => ({
  BellIcon: () => null,
  ClockRotateIcon: () => null,
  FingerprintIcon: () => null,
  GlobeIcon: () => null,
  LogOutIcon: () => null,
  PasswordIcon: () => null,
  TargetIcon: () => null,
  ThemeModeIcon: () => null,
}));
jest.mock('@/features/auth/passkey', () => ({
  clearStoredPasskeyBinding: jest.fn(),
  getStoredPasskeyBinding: jest.fn(() => null),
  isPasskeyCancelledError: jest.fn(() => false),
  isPasskeySupported: jest.fn(() => true),
  useDisablePasskey: () => ({ mutateAsync: jest.fn(), isPending: false }),
  usePasskeyCredentials: () => ({ data: [] }),
  useRegisterPasskey: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));
jest.mock('@/features/auth/use-auth-store', () => ({
  store: { subscribe: jest.fn() },
  useAuthStore: (selector: (s: { user: { email: string } }) => unknown) =>
    selector({ user: { email: 'learner@example.com' } }),
}));
jest.mock('@/components/ui', () => {
  const RN = require('react-native');
  return {
    View: RN.View,
    SafeAreaView: RN.View,
    Pressable: RN.Pressable,
    Text: RN.Text,
    BackButton: () => null,
    FocusAwareStatusBar: () => null,
    Mascot: () => null,
    showErrorMessage: jest.fn(),
  };
});
jest.mock('./components/settings-section', () => ({
  SettingsSection: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('./components/settings-row', () => ({
  SettingsRow: ({ testID, value, onPress }: {
    testID: string;
    value?: string;
    onPress?: () => void;
  }) => {
    const RN = require('react-native');
    return (
      <RN.Pressable testID={testID} onPress={onPress}>
        <RN.Text>{value}</RN.Text>
      </RN.Pressable>
    );
  },
}));
jest.mock('./components/option-sheet', () => ({
  OptionSheet: ({ visible, titleTx, options, selected, onSelect }: {
    visible: boolean;
    titleTx: string;
    options: { value: string | number }[];
    selected: string | number;
    onSelect: (value: string | number) => void;
  }) => {
    const RN = require('react-native');
    return visible
      ? (
          <RN.View testID={titleTx}>
            <RN.Text>{String(selected)}</RN.Text>
            {options.map(option => (
              <RN.Pressable
                key={option.value}
                testID={`${titleTx}-${option.value}`}
                onPress={() => onSelect(option.value)}
              />
            ))}
          </RN.View>
        )
      : null;
  },
}));

const runtime = globalThis as typeof globalThis & { __DEV__: boolean };
let deviceValues: Map<string, string>;

beforeEach(() => {
  jest.clearAllMocks();
  jest.replaceProperty(runtime, '__DEV__', false);
  deviceValues = new Map();
  jest.mocked(storage.getString).mockImplementation(key => deviceValues.get(key));
  jest.mocked(storage.set).mockImplementation((key, value) => {
    deviceValues.set(key, String(value));
  });
  jest.mocked(useMMKVString).mockImplementation((key, instance) => [
    instance?.getString(key),
    (value) => {
      const next = typeof value === 'function' ? value(instance?.getString(key)) : value;
      if (next !== undefined)
        instance?.set(key, next);
    },
  ]);
});

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});

it('uses English and the system theme when there is no local choice', () => {
  expect(getLanguage()).toBe('en'); // Even though the mocked phone is vi-VN.
  loadSelectedTheme();
  expect(Uniwind.setTheme).toHaveBeenCalledWith('system');
});

it('uses English when the saved language is unsupported', () => {
  deviceValues.set('local', 'fr');
  expect(getLanguage()).toBe('en');
});

it('keeps an explicit choice instead of following device defaults', () => {
  deviceValues.set('local', 'en');
  deviceValues.set('SELECTED_THEME', 'light');
  expect(getLanguage()).toBe('en');
  loadSelectedTheme();
  expect(Uniwind.setTheme).toHaveBeenCalledWith('light');
});

it('reads language from the same MMKV instance as startup', () => {
  deviceValues.set('local', 'en');
  const { result } = renderHook(useSelectedLanguage);
  expect(result.current.language).toBe('en');
  expect(useMMKVString).toHaveBeenCalledWith('local', storage);
});

it('keeps different theme choices on two devices', () => {
  deviceValues.set('SELECTED_THEME', 'light');
  const { result: firstResult, unmount } = renderHook(useSelectedTheme);
  expect(firstResult.current.selectedTheme).toBe('light');
  unmount();
  deviceValues = new Map([['SELECTED_THEME', 'dark']]);
  const { result: secondResult } = renderHook(useSelectedTheme);
  expect(secondResult.current.selectedTheme).toBe('dark');
});

it('settings displays and edits local choices without sending them to the server', () => {
  deviceValues.set('local', 'en');
  deviceValues.set('SELECTED_THEME', 'light');
  render(<SettingsScreen />);
  expect(screen.getByText(translate('settings.language_name_en'))).toBeTruthy();
  expect(screen.getByText(translate('settings.theme_light'))).toBeTruthy();
  fireEvent.press(screen.getByTestId('settings-theme'));
  fireEvent.press(screen.getByTestId('settings.select_theme-DARK'));
  expect(storage.set).toHaveBeenCalledWith('SELECTED_THEME', 'dark');
  expect(Uniwind.setTheme).toHaveBeenCalledWith('dark');
  fireEvent.press(screen.getByTestId('settings-language'));
  fireEvent.press(screen.getByTestId('settings.select_language-vi'));
  expect(storage.set).toHaveBeenCalledWith('local', 'vi');
  expect(RNRestart.restart).toHaveBeenCalledTimes(1);
  expect(mockMutate).not.toHaveBeenCalled();
});

it('opens collection limits instead of changing a global daily goal', () => {
  render(<SettingsScreen />);
  fireEvent.press(screen.getByTestId('settings-collection-limits'));
  expect(mockPush).toHaveBeenCalledWith('/collections');
  expect(mockMutate).not.toHaveBeenCalled();
});

it('does not cache a translation across languages', async () => {
  await i18n.changeLanguage('en');
  const english = translate('settings.theme_light');
  await i18n.changeLanguage('vi');
  expect(translate('settings.theme_light')).not.toBe(english);
});

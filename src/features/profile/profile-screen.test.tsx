import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as React from 'react';
import { ProfileScreen } from './profile-screen';

const mockUser = { id: 1, firstName: 'An', email: 'an@example.com', exp: 120, coin: 300 };
const mockMeRetry = jest.fn();
const mockStreakRetry = jest.fn();
const mockInventoryRetry = jest.fn();
let mockMeError = false;
let mockStreakError = false;
let mockInventoryError = false;
let mockBooster: { multiplier: number; expiresAt: string } | null = null;

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('@/features/auth/use-auth-store', () => ({ useAuthStore: (select: (state: unknown) => unknown) => select({ user: mockUser }) }));
jest.mock('./api', () => ({ useMe: () => ({ data: undefined, isError: mockMeError, refetch: mockMeRetry }) }));
jest.mock('@/features/progress/api', () => ({ useStreak: () => ({ data: { currentStreak: 3 }, isError: mockStreakError, refetch: mockStreakRetry }) }));
jest.mock('@/features/shop/hooks/use-shop-queries', () => ({
  useInventory: () => ({ data: { items: [], activeBooster: mockBooster }, serverOffset: 0, isError: mockInventoryError, refetch: mockInventoryRetry }),
}));
jest.mock('@/components/snapvocab', () => ({ Coin3D: () => null, AvatarFrame: () => null }));
jest.mock('@/components/ui/icons', () => new Proxy({}, { get: () => () => null }));
jest.mock('@/components/ui', () => {
  const RN = require('react-native');
  const translate = require('@/lib/i18n').translate;
  return {
    View: RN.View,
    Text: ({ tx, children, ...props }: { tx?: string; children?: React.ReactNode }) => <RN.Text {...props}>{tx ? translate(tx) : children}</RN.Text>,
    Pressable: RN.Pressable,
    SafeAreaView: RN.View,
    Image: RN.View,
    Mascot: RN.View,
    Button: ({ tx, onPress }: { tx: string; onPress: () => void }) => <RN.Pressable accessibilityRole="button" accessibilityLabel={translate(tx)} onPress={onPress}><RN.Text>{translate(tx)}</RN.Text></RN.Pressable>,
    FocusAwareStatusBar: () => null,
    useSurface: () => ({ background: '#fff', headerBg: '#fff' }),
  };
});
jest.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'en' } }) }));
jest.mock('@/lib/i18n', () => ({
  translate: (key: string, args: Record<string, unknown> = {}) => {
    const text = key.split('.').reduce<any>((node, part) => node?.[part], require('@/translations/en.json'));
    return typeof text === 'string' ? text.replace(/\{\{(\w+)\}\}/g, (_: string, field: string) => String(args[field] ?? '')) : key;
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockMeError = false;
  mockStreakError = false;
  mockInventoryError = false;
  mockBooster = null;
});

it('keeps total XP unchanged and labels the actual active booster separately', () => {
  mockBooster = { multiplier: 3, expiresAt: new Date(Date.now() + 60000).toISOString() };
  render(<ProfileScreen />);
  expect(screen.getByText('120')).toBeTruthy();
  expect(screen.getByText('XP boost ×3 is active')).toBeTruthy();
  expect(screen.queryByText('120 ×2')).toBeNull();
  expect(screen.queryByText('Achievements')).toBeNull();
});

it('keeps saved identity visible and retries only failed sources', async () => {
  mockMeError = true;
  mockInventoryError = true;
  render(<ProfileScreen />);
  expect(screen.getByText('An')).toBeTruthy();
  expect(screen.getByText(/Could not update profile, inventory/)).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
  await waitFor(() => expect(mockMeRetry).toHaveBeenCalledTimes(1));
  expect(mockInventoryRetry).toHaveBeenCalledTimes(1);
  expect(mockStreakRetry).not.toHaveBeenCalled();
});

it('removes the booster status when it expires without changing total XP', () => {
  jest.useFakeTimers();
  mockBooster = { multiplier: 2, expiresAt: new Date(Date.now() + 1000).toISOString() };
  const view = render(<ProfileScreen />);
  expect(screen.getByText('XP boost ×2 is active')).toBeTruthy();
  act(() => jest.advanceTimersByTime(1100));
  expect(screen.queryByText('XP boost ×2 is active')).toBeNull();
  expect(screen.getByText('120')).toBeTruthy();
  view.unmount();
  jest.useRealTimers();
});

import type { HomeWidgetDTO, StreakDTO, XpOverviewDTO } from '@/features/progress/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { ProfileScreen } from '@/features/profile/profile-screen';
import { useHomeWidget, useStreak, useXpOverview } from '@/features/progress/api';
import { HomeHeader } from '../components';
import { HomeScreen } from '../home-screen';

// The stored user still carries the raw users.streak_days (5) although the live streak is 0.
const mockUser = { id: 1, email: 'a@b.c', firstName: 'An', streakDays: 5, exp: 120, coin: 30 };

jest.mock('@/features/progress/api', () => ({
  useHomeWidget: jest.fn(),
  useXpOverview: jest.fn(),
  useStreak: jest.fn(),
  useProgressSummary: jest.fn(),
  useProgressHistory: jest.fn(),
  invalidateProgress: jest.fn(),
}));
jest.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (select: (s: unknown) => unknown) => select({ user: mockUser }),
  // lib/api/provider subscribes at import time (reached through ProfileScreen -> shop api).
  store: { subscribe: () => () => {} },
}));
jest.mock('@/features/profile/api', () => ({
  useMe: () => ({ data: mockUser, isLoading: false, refetch: jest.fn(), isRefetching: false }),
}));
jest.mock('@/features/profile/use-icon-colors', () => ({
  useIconColors: () => new Proxy({}, { get: () => new Proxy({}, { get: () => '#000' }) }),
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@/components/ui', () => {
  const RN = require('react-native');
  const Text = ({ tx, children, ...props }: { tx?: string; children?: React.ReactNode }) =>
    <RN.Text {...props}>{tx ?? children}</RN.Text>;
  return {
    Text,
    View: RN.View,
    Pressable: RN.Pressable,
    Image: RN.View,
    SafeAreaView: RN.View,
    Mascot: RN.View,
    UserAvatar: RN.View,
    Button: RN.View,
    FocusAwareStatusBar: () => null,
  };
});
jest.mock('@/components/ui/icons', () => new Proxy({}, { get: () => () => null }));
jest.mock('@/components/snapvocab', () => new Proxy({}, { get: () => () => null }));
jest.mock('@/components/Snapy', () => ({ Snapy: () => null }));
jest.mock('../components/home-search-bar', () => ({ HomeSearchBar: () => null }));
// Resolve real Vietnamese copy, so the suite asserts on what the learner reads.
jest.mock('@/lib/i18n', () => ({
  translate: (key: string, args: Record<string, unknown> = {}) => {
    const copy = key.split('.').reduce<any>((node, part) => node?.[part], require('@/translations/vi.json'));
    return typeof copy === 'string'
      ? copy.replace(/\{\{(\w+)\}\}/g, (_: string, n: string) => String(args[n] ?? ''))
      : key;
  },
}));
jest.mock('react-i18next', () => ({
  // @/lib/i18n registers this plugin at import time.
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    i18n: { language: 'vi' },
    t: (key: string, args: Record<string, unknown> = {}) => {
      const copy = require('@/translations/vi.json').progressUx[key.split('.').at(-1)!];
      return copy ? copy.replace(/\{\{(\w+)\}\}/g, (_: string, n: string) => String(args[n] ?? '')) : key;
    },
  }),
}));

type QueryState<T> = { data?: T; isLoading?: boolean; isError?: boolean };
function mockQuery<T>(hook: unknown, state: QueryState<T>) {
  jest.mocked(hook as () => unknown).mockReturnValue({
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
    ...state,
  });
}

const widget: HomeWidgetDTO = { totalWords: 8, learnedCount: 0, masteredCount: 0, dueCount: 3, currentStreak: 0 };
const xp: XpOverviewDTO = {
  totalXp: 120,
  level: { levelNumber: 2, title: 'Học viên', minXp: 100, nextLevelXp: 300, progress: 0.1 },
  recentEvents: [],
};
const liveStreak: StreakDTO = { currentStreak: 0, longestStreak: 5, lastStudiedDate: '2026-09-28' };

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('home and profile show only what the backend supports', () => {
  beforeEach(() => {
    mockQuery(useHomeWidget, { data: widget });
    mockQuery(useXpOverview, { data: xp });
    mockQuery(useStreak, { data: liveStreak });
  });
  afterEach(cleanup);

  it('loaded: saved total, real level, no SRS hero/CTA/copy', () => {
    renderWithClient(<HomeScreen />);
    expect(screen.getByText('8')).toBeTruthy();
    expect(screen.getByText('từ trong kho')).toBeTruthy();
    expect(screen.getByText('Cấp 2 · Học viên')).toBeTruthy();
    // dueCount=3 from the backend is structurally meaningless without SRS.
    expect(screen.queryByText(/cần ôn/i)).toBeNull();
    // A due count, not the study card's general "due cards" pitch.
    expect(screen.queryByText(/\d+ thẻ đến hạn/)).toBeNull();
    expect(screen.queryByText(/đã được ôn tập/)).toBeNull();
    expect(screen.queryByText('Flashcard')).toBeNull();
    expect(screen.getByText('Nhiệm vụ hàng ngày')).toBeTruthy();
  });

  it('loading: no fake zeros and no success state', () => {
    mockQuery(useHomeWidget, { isLoading: true });
    mockQuery(useXpOverview, { isLoading: true });
    renderWithClient(<HomeScreen />);
    expect(screen.queryByText('0')).toBeNull();
    expect(screen.queryByText('từ trong kho')).toBeNull();
    expect(screen.queryByText(/\d+ XP/)).toBeNull();
    expect(screen.queryByText(/đã được ôn tập/)).toBeNull();
  });

  it('error: retry instead of zeros or a congratulation', () => {
    mockQuery(useHomeWidget, { isError: true });
    mockQuery(useXpOverview, { isError: true });
    renderWithClient(<HomeScreen />);
    expect(screen.getAllByText('Thử lại')).toHaveLength(2);
    expect(screen.queryByText('từ trong kho')).toBeNull();
    expect(screen.queryByText(/đã được ôn tập/)).toBeNull();
    expect(screen.queryByText(/Cấp \d/)).toBeNull();
  });

  it('level=null never becomes "Cấp 1 · Tập sự"', () => {
    mockQuery(useXpOverview, { data: { totalXp: 45, level: null, recentEvents: [] } });
    renderWithClient(<HomeScreen />);
    expect(screen.getByText('45 XP')).toBeTruthy();
    expect(screen.queryByText(/Cấp \d/)).toBeNull();
    expect(screen.queryByText(/Tập sự/)).toBeNull();
  });

  it('header shows the live streak, not the stored users.streakDays', () => {
    renderWithClient(<HomeHeader />);
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.queryByText('5')).toBeNull();
  });

  it('profile shows the same live streak as header and stats', () => {
    renderWithClient(<ProfileScreen />);
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.queryByText('5')).toBeNull();
  });

  it('header streak is unknown (not 0) while the streak query loads', () => {
    mockQuery(useStreak, { isLoading: true });
    renderWithClient(<HomeHeader />);
    expect(screen.getByText('–')).toBeTruthy();
    expect(screen.queryByText('0')).toBeNull();
  });
});

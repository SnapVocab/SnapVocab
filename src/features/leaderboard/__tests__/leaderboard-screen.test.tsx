import type { Leaderboard, LeaderboardRow } from '../types';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { AppState } from 'react-native';
import { useLeaderboard } from '../api';
import { HomeLeaderboardCard } from '../components/home-leaderboard-card';
import { LeaderboardScreen } from '../leaderboard-screen';

const mockPush = jest.fn();
const mockDismissTo = jest.fn();
jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useRouter: () => ({ push: mockPush, dismissTo: mockDismissTo, back: jest.fn() }),
    useFocusEffect: (effect: () => (() => void) | void) => {
      React.useEffect(() => effect() ?? undefined, []);
    },
  };
});
jest.mock('../api', () => ({ useLeaderboard: jest.fn() }));
// Echo interpolation values so assertions can see what a message names.
jest.mock('@/lib/i18n', () => ({
  translate: (key: string, options?: Record<string, unknown>) => (options ? `${key}(${Object.values(options).join('|')})` : key),
}));
jest.mock('@/components/snapvocab', () => ({ AvatarFrame: () => null }));
jest.mock('@/components/ui/icons', () => ({ InfoIcon: () => null, CloseIcon: () => null }));
jest.mock('../components/leaderboard-info-sheet', () => ({ LeaderboardInfoSheet: () => null }));
let mockColorMode: 'light' | 'dark' = 'light';
jest.mock('expo-linear-gradient', () => {
  const RN = require('react-native');
  return {
    LinearGradient: ({ children, colors, testID }: { children?: React.ReactNode; colors: string[]; testID?: string }) => (
      <RN.View testID={testID} accessibilityHint={colors.join(',')}>{children}</RN.View>
    ),
  };
});
jest.mock('@/components/ui', () => {
  const RN = require('react-native');
  return {
    SafeAreaView: RN.View,
    FocusAwareStatusBar: () => null,
    useColorMode: () => mockColorMode,
    useSurface: () => ({ text: '#000' }),
    Text: ({ children, accessibilityLabel }: { children?: React.ReactNode; accessibilityLabel?: string }) => (
      <RN.Text accessibilityLabel={accessibilityLabel}>{children}</RN.Text>
    ),
    ScreenHeader: ({ title, right }: { title: string; right?: React.ReactNode }) => (
      <RN.View>
        <RN.Text>{title}</RN.Text>
        {right}
      </RN.View>
    ),
    Button: ({ tx, onPress }: { tx: string; onPress: () => void }) => (
      <RN.Pressable accessibilityRole="button" onPress={onPress}><RN.Text>{tx}</RN.Text></RN.Pressable>
    ),
  };
});

function row(rank: number, name: string, score: number): LeaderboardRow {
  return { rank, displayName: name, avatarUrl: null, avatarFrameUrl: null, score, rankChange: null, isMe: false };
}

// Fixed "now" in the week of 2026-11-09 so cached data counts as the right window.
const NOW = new Date('2026-11-10T05:30:00Z');
const originalAppState = AppState.currentState;

function board(patch: Partial<Leaderboard> = {}): Leaderboard {
  return {
    weekStart: '2026-11-09',
    weekEnd: '2026-11-15',
    timezone: 'Asia/Ho_Chi_Minh',
    endsAt: '2026-11-15T17:00:00Z',
    isFinal: false,
    asOf: '2026-11-10T05:00:12Z',
    participants: 62,
    entries: [{ ...row(1, 'Lan', 1240), rankChange: 0 }, { ...row(2, 'Minh', 980), rankChange: 1 }, row(2, 'Hoa', 980)],
    me: { eligible: true, rank: 62, score: 120, rankChange: -2, xpToNextRank: 31, nextRank: 60 },
    ...patch,
  };
}

const refetch = jest.fn();
function mockQuery(data: Leaderboard | undefined, extra: Record<string, unknown> = {}) {
  jest.mocked(useLeaderboard).mockReturnValue(
    { data, dataUpdatedAt: NOW.getTime(), isError: false, isFetching: false, isStale: false, refetch, ...extra } as unknown as ReturnType<typeof useLeaderboard>,
  );
}

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  jest.clearAllMocks();
  mockColorMode = 'light';
  AppState.currentState = 'active';
});
afterEach(() => {
  AppState.currentState = originalAppState;
  jest.useRealTimers();
});

it('lists rows in API order with shared ranks and pins "you" from me when outside them', () => {
  mockQuery(board());
  render(<LeaderboardScreen />);
  expect(screen.getByText('09/11 – 15/11/2026')).toBeOnTheScreen();
  expect(screen.getByText('leaderboard.count(62)')).toBeOnTheScreen();
  expect(screen.getByText('leaderboard.updated(12:00)')).toBeOnTheScreen();
  expect(screen.getAllByText('2')).toHaveLength(2);
  expect(screen.getByText('leaderboard.footer(3|62)')).toBeOnTheScreen();
  // Pinned band: rank, XP, trend and the API gap, never computed locally.
  expect(screen.getByText('62')).toBeOnTheScreen();
  expect(screen.getByText('leaderboard.xp(120)')).toBeOnTheScreen();
  expect(screen.getByText('▼ 2')).toBeOnTheScreen();
  expect(screen.getByText('leaderboard.gap(31|60)')).toBeOnTheScreen();
  expect(screen.getByLabelText('leaderboard.trend.a11y_none(0)')).toBeOnTheScreen();
  // This week has no status label.
  expect(screen.queryByText('leaderboard.status.finalizing')).toBeNull();
});

it('does not pin when "you" is among the rows, and puts the gap under that row', () => {
  mockQuery(board({
    entries: [row(1, 'Lan', 1240), { ...row(2, 'Bạn', 980), isMe: true }],
    me: { eligible: true, rank: 2, score: 980, rankChange: null, xpToNextRank: 261, nextRank: 1 },
  }));
  render(<LeaderboardScreen />);
  expect(screen.getAllByText('leaderboard.me')).toHaveLength(1);
  expect(screen.getByText('leaderboard.gap(261|1)')).toBeOnTheScreen();
});

it('invites an unranked learner to learn, and tells an admin they are not ranked', () => {
  mockQuery(board({ me: { eligible: true, rank: null, score: 0, rankChange: null, xpToNextRank: null, nextRank: null } }));
  const view = render(<LeaderboardScreen />);
  expect(screen.getByText('leaderboard.unranked_current')).toBeOnTheScreen();
  fireEvent.press(screen.getByText('leaderboard.learn'));
  expect(mockDismissTo).toHaveBeenCalledWith('/learn');
  view.unmount();

  mockQuery(board({ me: { eligible: false, rank: null, score: 0, rankChange: null, xpToNextRank: null, nextRank: null } }));
  render(<LeaderboardScreen />);
  expect(screen.getByText('leaderboard.admin')).toBeOnTheScreen();
  expect(screen.queryByText('leaderboard.learn')).toBeNull();
});

it('last week shows the settle status and no gap invitation', () => {
  mockQuery(board({
    weekStart: '2026-11-02',
    weekEnd: '2026-11-08',
    asOf: '2026-11-08T17:01:00Z',
    me: { eligible: true, rank: 62, score: 120, rankChange: null, xpToNextRank: 31, nextRank: 60 },
  }));
  render(<LeaderboardScreen />);
  fireEvent.press(screen.getByText('leaderboard.period.previous'));
  expect(screen.getByText('leaderboard.status.finalizing')).toBeOnTheScreen();
  expect(screen.getByText('leaderboard.finalizing_note')).toBeOnTheScreen();
  expect(screen.getAllByText('leaderboard.previous_trend_note')).toHaveLength(1);
  expect(screen.queryByText('—')).toBeNull();
  expect(screen.getByText('leaderboard.updated_date(00:01|09/11/2026)')).toBeOnTheScreen();
  expect(screen.queryByText(/leaderboard\.gap/)).toBeNull();
});

it('asks twice at most while last week is settling, a minute apart', () => {
  mockQuery(board({ weekStart: '2026-11-02', weekEnd: '2026-11-08' }));
  render(<LeaderboardScreen />);
  fireEvent.press(screen.getByText('leaderboard.period.previous'));
  refetch.mockClear();
  act(() => jest.advanceTimersByTime(60_000));
  expect(refetch).toHaveBeenCalledTimes(1);
  act(() => jest.advanceTimersByTime(60_000));
  expect(refetch).toHaveBeenCalledTimes(2);
  act(() => jest.advanceTimersByTime(600_000));
  expect(refetch).toHaveBeenCalledTimes(2);
});

it('skips the automatic settle check while the app is in the background', () => {
  mockQuery(board({ weekStart: '2026-11-02', weekEnd: '2026-11-08' }));
  render(<LeaderboardScreen />);
  fireEvent.press(screen.getByText('leaderboard.period.previous'));
  refetch.mockClear();
  AppState.currentState = 'background';
  act(() => jest.advanceTimersByTime(120_000));
  expect(refetch).not.toHaveBeenCalled();
});

it('shows an error without data, and keeps the board with a warning when a reload fails', () => {
  mockQuery(undefined, { isError: true });
  const view = render(<LeaderboardScreen />);
  expect(screen.getByText('leaderboard.error')).toBeOnTheScreen();
  fireEvent.press(screen.getByText('leaderboard.retry'));
  expect(refetch).toHaveBeenCalled();
  view.unmount();

  mockQuery(board(), { isError: true });
  render(<LeaderboardScreen />);
  expect(screen.getByText('leaderboard.cached_error')).toBeOnTheScreen();
  expect(screen.getByText('Lan')).toBeOnTheScreen();
});

it('an empty board replaces the list and does not repeat the unranked note', () => {
  mockQuery(board({ participants: 0, entries: [], me: { eligible: true, rank: null, score: 0, rankChange: null, xpToNextRank: null, nextRank: null } }));
  render(<LeaderboardScreen />);
  expect(screen.getByText('leaderboard.empty_current_title')).toBeOnTheScreen();
  expect(screen.queryByText('leaderboard.unranked_current')).toBeNull();
  expect(screen.queryByText(/leaderboard\.footer/)).toBeNull();
});

it('hides last week\'s cached board under "this week" while Monday\'s refetch runs', () => {
  jest.setSystemTime(new Date('2026-11-15T17:00:30Z')); // Monday 16/11 00:00:30 in Vietnam
  mockQuery(board(), { isFetching: true });
  render(<LeaderboardScreen />);
  expect(screen.queryByText('Lan')).toBeNull();
  expect(screen.getByLabelText('leaderboard.loading')).toBeOnTheScreen();
});

it('does not restore an expired snapshot when the Monday refetch fails', () => {
  jest.setSystemTime(new Date('2026-11-15T17:00:30Z'));
  mockQuery(board(), { isError: true });
  render(<LeaderboardScreen />);
  expect(screen.queryByText('Lan')).toBeNull();
  expect(screen.getByText('leaderboard.error')).toBeOnTheScreen();
});

it('home shows the admin note on an empty board and can retry a failed refresh', () => {
  mockQuery(board({
    entries: [],
    participants: 0,
    me: { eligible: false, rank: null, score: 0, rankChange: null, xpToNextRank: null, nextRank: null },
  }), { isError: true });
  render(<HomeLeaderboardCard />);
  expect(screen.getByText('leaderboard.empty_current_title')).toBeOnTheScreen();
  expect(screen.getByText('leaderboard.admin')).toBeOnTheScreen();
  expect(screen.queryByText('leaderboard.learn')).toBeNull();
  fireEvent.press(screen.getByText('leaderboard.retry'));
  expect(refetch).toHaveBeenCalledTimes(1);
});

it('home snippet: top 3, then "you" below them, and a link to the full board', () => {
  mockQuery(board());
  render(<HomeLeaderboardCard />);
  expect(screen.getByText('leaderboard.home_title')).toBeOnTheScreen();
  expect(screen.getByText('62')).toBeOnTheScreen();
  expect(screen.queryByText(/leaderboard\.gap/)).toBeNull();
  fireEvent.press(screen.getByText('leaderboard.link'));
  expect(mockPush).toHaveBeenCalledWith('/leaderboard');
  expect(useLeaderboard).toHaveBeenCalledWith('CURRENT', 3);
});

it('renders the Direction B Top 3 stage (proposed V2 light / V4 dark palette, not PO-approved) and splits rank 4+ into the list', () => {
  const entries = [
    row(1, 'Lan', 1680),
    row(2, 'Bao', 1490),
    row(3, 'Vy', 1360),
    row(4, 'Nam', 1290),
    { ...row(5, 'Minh', 1150), isMe: true, rankChange: 3 },
  ];
  mockQuery(board({
    entries,
    me: { eligible: true, rank: 5, score: 1150, rankChange: 3, xpToNextRank: 141, nextRank: 4 },
  }));

  const view = render(<LeaderboardScreen />);
  expect(screen.getByTestId('leaderboard-top3-stage')).toHaveProp('accessibilityHint', '#FFFFFF,#F4FDEC,#E8F9DA');
  expect(screen.getByText('leaderboard.list_range(4)')).toBeOnTheScreen();
  expect(screen.getByText('Nam')).toBeOnTheScreen();
  expect(screen.getByText('Minh')).toBeOnTheScreen();
  expect(screen.queryByText('1.150 / 1.291')).toBeNull();
  expect(screen.queryByText('leaderboard.empty_current_title')).toBeNull();
  view.unmount();

  mockColorMode = 'dark';
  render(<LeaderboardScreen />);
  expect(screen.getByTestId('leaderboard-top3-stage')).toHaveProp('accessibilityHint', '#1D2945,#26385E,#203052');
});

it('a tie across the stage edge (1-2-3-3) keeps 3 on the stage and starts the list header at rank 3', () => {
  mockQuery(board({
    entries: [row(1, 'Lan', 1600), row(2, 'Bao', 1120), row(3, 'Hoa', 520), row(3, 'Khoa', 520), row(5, 'Nam', 500)],
  }));
  render(<LeaderboardScreen />);
  expect(screen.getByTestId('leaderboard-top3-slot-3')).toBeOnTheScreen();
  expect(screen.getByText('Khoa')).toBeOnTheScreen();
  expect(screen.getByText('leaderboard.list_range(3)')).toBeOnTheScreen();
});

it('does not show empty board when 1-3 entries exist and shows previous-week Top 3 banner for "you"', () => {
  mockQuery(board({
    weekStart: '2026-11-02',
    weekEnd: '2026-11-08',
    isFinal: true,
    entries: [row(1, 'Lan', 2200), row(2, 'Bao', 2100), { ...row(3, 'Minh', 1890), isMe: true }],
    me: { eligible: true, rank: 3, score: 1890, rankChange: null, xpToNextRank: 211, nextRank: 2 },
  }));
  render(<LeaderboardScreen />);
  fireEvent.press(screen.getByText('leaderboard.period.previous'));
  expect(screen.getByTestId('leaderboard-top3-stage')).toBeOnTheScreen();
  expect(screen.queryByText('leaderboard.empty_previous')).toBeNull();
  expect(screen.queryByText(/leaderboard.list_range/)).toBeNull();
  expect(screen.getByText('leaderboard.me_previous_top3(3|1.890)')).toBeOnTheScreen();
  expect(screen.queryByText(/leaderboard\.gap/)).toBeNull();
});

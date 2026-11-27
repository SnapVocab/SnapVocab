import type { AppStateStatus } from 'react-native';
import type { DailyMissions } from '../types';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as React from 'react';
import { AppState } from 'react-native';
import { EXPLORE_HREF } from '@/features/study/today-state';
import { useClaimMission, useDailyMissions } from '../api';
import { actions, MissionsScreen, studyHref } from '../missions-screen';
import { RENDERED_TRIGGERS } from '../types';

const mockPush = jest.fn();
const mockDismissTo = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, dismissTo: mockDismissTo, back: mockBack }),
  useFocusEffect: jest.fn(),
}));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'stable-uuid' }));
jest.mock('../api', () => ({ useDailyMissions: jest.fn(), useClaimMission: jest.fn(), missionErrorCode: () => undefined }));
jest.mock('@/features/study/api', () => ({ useStudyToday: () => ({ data: undefined }) }));
jest.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (selector: (s: { user: { coin: number; exp: number } }) => unknown) =>
    selector({ user: { coin: 145, exp: 420 } }),
}));
// Echo interpolation values so assertions can see what a message names.
jest.mock('@/lib/i18n', () => ({
  translate: (key: string, options?: Record<string, unknown>) => (options ? `${key}(${Object.values(options).join('|')})` : key),
}));
jest.mock('@/components/ui/rewards', () => ({ RewardIcon: () => null }));
jest.mock('@/components/snapvocab', () => ({ MissionIcon3D: () => null }));
jest.mock('@/components/Snapy', () => ({ Snapy: () => null }));
jest.mock('@/components/ui', () => {
  const RN = require('react-native');
  return {
    SafeAreaView: RN.View,
    FocusAwareStatusBar: () => null,
    Text: ({ tx, children }: { tx?: string; children?: React.ReactNode }) => <RN.Text>{tx ?? children}</RN.Text>,
    Button: ({ tx, onPress, disabled }: { tx: string; onPress: () => void; disabled?: boolean }) => (
      <RN.Pressable accessibilityRole="button" onPress={onPress} disabled={disabled}>
        <RN.Text>{tx}</RN.Text>
      </RN.Pressable>
    ),
  };
});

const data: DailyMissions = {
  missionDate: '2026-10-05',
  timezone: 'Asia/Ho_Chi_Minh',
  serverNow: '2026-10-05T16:59:58Z',
  resetAt: '2026-10-05T17:00:00Z',
  missions: Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    code: `M${i}`,
    name: `Mission ${i}`,
    description: 'Learn',
    category: 'QUIZ',
    triggerEvent: 'QUIZ_COMPLETED',
    slot: i + 1,
    targetValue: 1,
    currentProgress: i === 0 ? 1 : 0,
    status: i === 0 ? 'COMPLETED' : 'IN_PROGRESS',
    reward: { coin: 5, xp: 10, itemCode: null, itemName: null, itemFallbackCoin: null },
    completedAt: null,
    claimedAt: null,
  })),
};

// PD-DM-13: the app announces exactly the triggers it has a CTA for, or the backend hands out a mission it cannot show.
it('announces every trigger it renders and only those', () => {
  expect(Object.keys(actions).sort()).toEqual([...RENDERED_TRIGGERS].sort());
});

// A study mission never lands on an empty session: no library → ready-made sets; today done → a quiz still keeps the streak.
it('routes study missions by what today can offer', () => {
  const today = { dueCount: 0, newCount: 0, sessionCount: 0, studiedToday: 0, newPerDay: 20, backlog: false, returning: false, dueTomorrow: 0, totalWords: 0 };
  expect(studyHref('SRS_REVIEW_COMPLETED', '/study/session', today)).toBe(EXPLORE_HREF);
  expect(studyHref('LEARNING_ACTIVITY_RECORDED', '/study/session', today)).toBe(EXPLORE_HREF);
  const done = { ...today, totalWords: 40, studiedToday: 20 };
  expect(studyHref('SRS_REVIEW_COMPLETED', '/study/session', done)).toBe('/learn');
  expect(studyHref('LEARNING_ACTIVITY_RECORDED', '/study/session', done)).toBe('/study/quiz-setup');
  const due = { ...done, dueCount: 5, sessionCount: 5 };
  expect(studyHref('SRS_REVIEW_COMPLETED', '/study/session', due)).toBe('/study/session');
  expect(studyHref('SRS_REVIEW_COMPLETED', '/study/session', undefined)).toBe('/study/session');
  expect(studyHref('QUIZ_COMPLETED', '/study/quiz-setup', today)).toBe('/study/quiz-setup');
});

describe('daily Mission screen lifecycle (Snapy Stage)', () => {
  const refetch = jest.fn(() => Promise.resolve({ data }));
  const mutateAsync = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    // clearAllMocks keeps queued *Once values; a test that stops early must not hand them to the next one.
    mutateAsync.mockReset();
    jest.mocked(useDailyMissions).mockReturnValue({ data, dataUpdatedAt: Date.now(), refetch, isPending: false, isError: false, isRefetching: false } as unknown as ReturnType<typeof useDailyMissions>);
    jest.mocked(useClaimMission).mockReturnValue({ mutateAsync, isPending: false, isError: false } as unknown as ReturnType<typeof useClaimMission>);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('renders five cards, dual Coin+XP header, warns on unclaimed rewards and keeps idempotency key after lost response', async () => {
    jest.useRealTimers();
    mutateAsync.mockRejectedValueOnce(new Error('lost response')).mockResolvedValueOnce({
      missionId: 1,
      status: 'CLAIMED',
      coinBalance: 150,
      totalXp: 430,
      replayed: true,
      rewardGranted: { coin: 5, xp: 10, itemCode: null, itemName: null, itemQuantity: 0, fallbackCoin: 0 },
    });
    // Real timers: an hour before reset keeps the urgent state without racing a slow first render.
    jest.mocked(useDailyMissions).mockReturnValue({ data: { ...data, serverNow: '2026-10-05T16:00:00Z' }, dataUpdatedAt: Date.now(), refetch, isPending: false, isError: false, isRefetching: false } as unknown as ReturnType<typeof useDailyMissions>);
    render(<MissionsScreen />);
    expect(screen.getAllByText(/^Mission \d$/)).toHaveLength(5);
    expect(screen.getByTestId('missions-wallet-coin')).toBeTruthy();
    expect(screen.getByTestId('missions-wallet-xp')).toBeTruthy();
    expect(screen.getByText(/missions\.unclaimed_urgent/)).toBeTruthy();
    fireEvent.press(screen.getByText('missions.claim'));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.press(screen.getByText('missions.claim'));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(2));
    expect(mutateAsync.mock.calls).toEqual([
      [{ missionId: 1, idempotencyKey: 'stable-uuid' }],
      [{ missionId: 1, idempotencyKey: 'stable-uuid' }],
    ]);
    // Replayed claim must NOT trigger double-credit delta badges.
    expect(screen.queryByTestId('missions-wallet-coin-delta')).toBeNull();
    expect(screen.queryByTestId('missions-wallet-xp-delta')).toBeNull();
    fireEvent.press(screen.getAllByText('missions.action.quiz')[0]);
    expect(mockPush).toHaveBeenCalledWith('/study/quiz-setup');
  });

  it('pops BOTH Coin and XP deltas on a fresh non-replayed claim and keeps card order stable', async () => {
    jest.useRealTimers();
    const mixed: DailyMissions = {
      ...data,
      serverNow: '2026-10-05T10:00:00Z',
      missions: data.missions.map((m, i) => (i === 3 ? { ...m, status: 'COMPLETED', currentProgress: 1 } : { ...m, status: 'IN_PROGRESS', currentProgress: 0 })),
    };
    jest.mocked(useDailyMissions).mockReturnValue({ data: mixed, dataUpdatedAt: Date.now(), refetch, isPending: false, isError: false, isRefetching: false } as unknown as ReturnType<typeof useDailyMissions>);
    mutateAsync.mockResolvedValueOnce({
      missionId: 4,
      status: 'CLAIMED',
      coinBalance: 165,
      totalXp: 460,
      replayed: false,
      rewardGranted: { coin: 20, xp: 40, itemCode: null, itemName: null, itemQuantity: 0, fallbackCoin: 0 },
    });
    render(<MissionsScreen />);
    // Ready mission (id 4, slot 4) is hoisted to the top before in-progress missions.
    const beforeCards = screen.getAllByTestId(/^mission-card-/);
    expect(beforeCards[0].props.testID).toBe('mission-card-4');

    fireEvent.press(screen.getByText('missions.claim'));
    expect(await screen.findByText('missions.granted(missions.granted_coin(20), missions.granted_xp(40))')).toBeTruthy();
    expect(screen.getByTestId('missions-wallet-coin-delta')).toBeTruthy();
    expect(screen.getByTestId('missions-wallet-xp-delta')).toBeTruthy();

    // Card stays in position 0 after claim (no mid-session list jumping).
    const afterCards = screen.getAllByTestId(/^mission-card-/);
    expect(afterCards[0].props.testID).toBe('mission-card-4');
  });

  it('renders the 5/5 Victory Stage and Unified Ledger when all missions are claimed', () => {
    jest.useRealTimers();
    const allClaimed: DailyMissions = {
      ...data,
      serverNow: '2026-10-05T10:00:00Z',
      missions: data.missions.map(m => ({ ...m, status: 'CLAIMED', currentProgress: m.targetValue })),
    };
    jest.mocked(useDailyMissions).mockReturnValue({ data: allClaimed, dataUpdatedAt: Date.now(), refetch, isPending: false, isError: false, isRefetching: false } as unknown as ReturnType<typeof useDailyMissions>);
    render(<MissionsScreen />);
    expect(screen.getByTestId('missions-victory-stage')).toBeTruthy();
    expect(screen.getByTestId('missions-victory-ledger')).toBeTruthy();
    expect(screen.getByText('missions.victory_title')).toBeTruthy();
    expect(screen.queryByText('missions.claim')).toBeNull();
    fireEvent.press(screen.getByText('missions.next_day_cta'));
    expect(mockDismissTo).toHaveBeenCalledWith('/learn');
  });

  it('refetches at the server deadline and when returning to foreground, and removes its subscription', () => {
    let listener!: (state: AppStateStatus) => void;
    const remove = jest.fn();
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_, callback) => {
      listener = callback;
      return { remove };
    });
    const view = render(<MissionsScreen />);
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(refetch).toHaveBeenCalledTimes(1);
    act(() => {
      listener('active');
    });
    expect(refetch).toHaveBeenCalledTimes(2);
    view.unmount();
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('shows an error instead of fabricated missions when the catalog is unavailable', () => {
    jest.mocked(useDailyMissions).mockReturnValue({ data: undefined, refetch, isPending: false, isError: true } as unknown as ReturnType<typeof useDailyMissions>);
    render(<MissionsScreen />);
    expect(screen.getByText('missions.load_error')).toBeTruthy();
    expect(screen.queryAllByText(/^Mission \d$/)).toHaveLength(0);
  });

  it('routes add-word through the Learn library and shows the granted item on the claimed card', async () => {
    jest.useRealTimers();
    const missions = data.missions.map((m, i) => (i === 1 ? { ...m, triggerEvent: 'TOPIC_ITEM_CREATED' as const } : m));
    jest.mocked(useDailyMissions).mockReturnValue({ data: { ...data, serverNow: '2026-10-05T10:00:00Z', missions }, dataUpdatedAt: Date.now(), refetch, isPending: false, isError: false } as unknown as ReturnType<typeof useDailyMissions>);
    mutateAsync.mockResolvedValueOnce({ rewardGranted: { coin: 5, xp: 10, itemCode: 'XP_BOOSTER_X2_15M', itemName: '×2 XP · 15 phút', itemQuantity: 1, fallbackCoin: 0 }, replayed: false });
    render(<MissionsScreen />);
    fireEvent.press(screen.getByText('missions.action.add_word'));
    expect(mockDismissTo).toHaveBeenCalledWith('/learn');
    fireEvent.press(screen.getByText('missions.claim'));
    expect(await screen.findByText('missions.granted(missions.granted_coin(5), missions.granted_xp(10), ×2 XP · 15 phút)')).toBeTruthy();
  });

  // PD-DM-07: the SRS mission opens today's session; a trigger newer than this build gets no CTA, never a crash.
  it('routes the SRS mission to the study session and survives an unknown trigger', () => {
    jest.useRealTimers();
    const missions = data.missions.map((m, i) => i === 2
      ? { ...m, category: 'SRS' as const, triggerEvent: 'SRS_REVIEW_COMPLETED' as const }
      : i === 3 ? { ...m, triggerEvent: 'SCAN_SAVED' as never } : m);
    jest.mocked(useDailyMissions).mockReturnValue({ data: { ...data, serverNow: '2026-10-05T10:00:00Z', missions }, dataUpdatedAt: Date.now(), refetch, isPending: false, isError: false } as unknown as ReturnType<typeof useDailyMissions>);
    render(<MissionsScreen />);
    expect(screen.getAllByText(/^Mission \d$/)).toHaveLength(5);
    expect(screen.getAllByText('missions.action.quiz')).toHaveLength(2);
    fireEvent.press(screen.getByText('missions.action.srs_review'));
    expect(mockPush).toHaveBeenCalledWith('/study/session');
  });

  // PD-SHX-04 trial: the item replaces the Coin; holding the max, the learner gets the fallback Coin instead.
  it('names an item-only reward, never shows 0 Coin, and reports the fallback', async () => {
    jest.useRealTimers();
    const reward = { coin: 0, xp: 20, itemCode: 'XP_BOOSTER_X2_15M', itemName: '×2 XP · 15 phút', itemFallbackCoin: 10 };
    const missions = data.missions.map((m, i) => (i === 0 ? { ...m, reward } : m));
    jest.mocked(useDailyMissions).mockReturnValue({ data: { ...data, serverNow: '2026-10-05T10:00:00Z', missions }, dataUpdatedAt: Date.now(), refetch, isPending: false, isError: false } as unknown as ReturnType<typeof useDailyMissions>);
    mutateAsync.mockResolvedValueOnce({ rewardGranted: { coin: 0, xp: 20, itemCode: reward.itemCode, itemName: reward.itemName, itemQuantity: 0, fallbackCoin: 10 }, replayed: false });
    render(<MissionsScreen />);
    expect(screen.getByText('missions.item(×2 XP · 15 phút)')).toBeTruthy();
    expect(screen.queryByText('0')).toBeNull();
    expect(screen.queryByText(/XP_BOOSTER/)).toBeNull();
    fireEvent.press(screen.getByText('missions.claim'));
    expect(await screen.findByText('missions.granted(missions.granted_coin(10), missions.granted_xp(20)) · missions.fallback_coin')).toBeTruthy();
  });

  it('removes actions and shows expired status from a cached day once its reset has passed', () => {
    jest.mocked(useDailyMissions).mockReturnValue({ data: { ...data, receivedAt: Date.now() - 5000 }, dataUpdatedAt: Date.now(), refetch, isPending: false, isError: true, isRefetching: false } as unknown as ReturnType<typeof useDailyMissions>);
    render(<MissionsScreen />);
    expect(screen.getByText('missions.ended_unclaimed(1)')).toBeTruthy();
    expect(screen.getByText('missions.expired_badge')).toBeTruthy();
    // The ended stage talks about yesterday, so its earnings line must too.
    expect(screen.getByText('missions.earned_yesterday')).toBeTruthy();
    expect(screen.queryByText('missions.earned_today')).toBeNull();
    expect(screen.queryByText('missions.claim')).toBeNull();
    expect(screen.queryAllByText('missions.action.quiz')).toHaveLength(0);
  });

  it('does not postpone the reset when a claim edits the cache timestamp', () => {
    jest.mocked(useDailyMissions).mockReturnValue({
      data: { ...data, receivedAt: Date.now() - 1000 },
      dataUpdatedAt: Date.now(),
      refetch,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useDailyMissions>);
    render(<MissionsScreen />);
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});

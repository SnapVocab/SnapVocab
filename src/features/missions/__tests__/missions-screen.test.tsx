import type { AppStateStatus } from 'react-native';
import type { DailyMissions } from '../types';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as React from 'react';
import { AppState } from 'react-native';
import { useClaimMission, useDailyMissions } from '../api';
import { MissionsScreen } from '../missions-screen';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, back: jest.fn() }) }));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'stable-uuid' }));
jest.mock('../api', () => ({ useDailyMissions: jest.fn(), useClaimMission: jest.fn(), missionErrorCode: () => undefined }));
jest.mock('@/lib/i18n', () => ({ translate: (key: string) => key }));
jest.mock('@/components/ui/rewards', () => ({ RewardIcon: () => null }));
jest.mock('@/components/ui', () => {
  const RN = require('react-native');
  return {
    SafeAreaView: RN.View,
    FocusAwareStatusBar: () => null,
    Text: ({ tx, children }: { tx?: string; children?: React.ReactNode }) => <RN.Text>{tx ?? children}</RN.Text>,
    ScreenHeader: ({ title }: { title: string }) => <RN.Text>{title}</RN.Text>,
    Button: ({ tx, onPress, disabled }: { tx: string; onPress: () => void; disabled?: boolean }) => <RN.Pressable accessibilityRole="button" onPress={onPress} disabled={disabled}><RN.Text>{tx}</RN.Text></RN.Pressable>,
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
    reward: { coin: 5, xp: 10, itemCode: null, itemFallbackCoin: null },
    completedAt: null,
    claimedAt: null,
  })),
};

describe('daily Mission screen lifecycle', () => {
  const refetch = jest.fn();
  const mutateAsync = jest.fn();
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    jest.mocked(useDailyMissions).mockReturnValue({ data, dataUpdatedAt: Date.now(), refetch, isPending: false, isError: false, isRefetching: false } as unknown as ReturnType<typeof useDailyMissions>);
    jest.mocked(useClaimMission).mockReturnValue({ mutateAsync, isPending: false, isError: false } as unknown as ReturnType<typeof useClaimMission>);
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('renders five cards, warns on unclaimed rewards and keeps the key after a lost response', async () => {
    jest.useRealTimers();
    mutateAsync.mockRejectedValueOnce(new Error('lost response')).mockResolvedValueOnce({ replayed: true });
    render(<MissionsScreen />);
    expect(screen.getAllByText(/^Mission \d$/)).toHaveLength(5);
    expect(screen.getByText('1/5')).toBeTruthy();
    expect(screen.getByText('missions.unclaimed_warning')).toBeTruthy();
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
    fireEvent.press(screen.getAllByText('missions.action.quiz')[0]);
    expect(mockPush).toHaveBeenCalledWith('/study/quiz-setup');
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

  it('routes add-word through Collections and shows the granted item on the claimed card', async () => {
    jest.useRealTimers();
    const missions = data.missions.map((m, i) => (i === 1 ? { ...m, triggerEvent: 'TOPIC_ITEM_CREATED' as const } : m));
    jest.mocked(useDailyMissions).mockReturnValue({ data: { ...data, serverNow: '2026-10-05T10:00:00Z', missions }, dataUpdatedAt: Date.now(), refetch, isPending: false, isError: false } as unknown as ReturnType<typeof useDailyMissions>);
    mutateAsync.mockResolvedValueOnce({ rewardGranted: { coin: 5, xp: 10, itemCode: 'STREAK_FREEZE', itemQuantity: 1, fallbackCoin: 0 } });
    render(<MissionsScreen />);
    fireEvent.press(screen.getByText('missions.action.add_word'));
    expect(mockPush).toHaveBeenCalledWith('/collections');
    fireEvent.press(screen.getByText('missions.claim'));
    expect(await screen.findByText('missions.granted · missions.item')).toBeTruthy();
  });

  it('removes actions from a cached day once its reset has passed', () => {
    jest.mocked(useDailyMissions).mockReturnValue({ data: { ...data, receivedAt: Date.now() - 5000 }, dataUpdatedAt: Date.now(), refetch, isPending: false, isError: true, isRefetching: false } as unknown as ReturnType<typeof useDailyMissions>);
    render(<MissionsScreen />);
    expect(screen.getByText('missions.ended')).toBeTruthy();
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

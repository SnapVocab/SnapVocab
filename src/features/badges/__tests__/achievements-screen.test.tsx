import type { BadgeItem, BadgesView } from '../types';
import { act, render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { AchievementsScreen } from '../achievements-screen';
import { markBadgesSeen, syncBadges, useBadges } from '../api';
import { useBadgeSessionStore } from '../use-badge-session-store';

const focus: { cleanup?: () => void } = {};
let mockParams: { highlight?: string } = {};
jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
    useLocalSearchParams: () => mockParams,
    useFocusEffect: (effect: () => (() => void) | void) => {
      React.useEffect(() => {
        focus.cleanup = effect() ?? undefined;
        return () => focus.cleanup?.();
      }, []);
    },
  };
});
jest.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({}) }));
jest.mock('../api', () => ({ useBadges: jest.fn(), syncBadges: jest.fn(), markBadgesSeen: jest.fn() }));
jest.mock('@/lib/i18n', () => ({ translate: (key: string, opts?: Record<string, unknown>) => (opts ? `${key} ${JSON.stringify(opts)}` : key) }));
jest.mock('@/components/snapvocab', () => ({ AchievementArtifact: () => null, AchievementGlow: () => null, AchievementTrophy3D: () => null, Coin3D: () => null, XPOrb3D: () => null }));
jest.mock('@/components/ui/snapy', () => ({ Snapy: () => null }));
jest.mock('@/components/ui/icons', () => ({ CheckCircleIcon: () => null, CloseIcon: () => null, LockIcon: () => null, SparklesIcon: () => null }));
jest.mock('../components/achievement-detail-sheet', () => ({ AchievementDetailSheet: () => null }));
jest.mock('@/components/ui', () => {
  const RN = require('react-native');
  return {
    SafeAreaView: RN.View,
    FocusAwareStatusBar: () => null,
    Text: RN.Text,
    ScreenHeader: ({ title }: { title: string }) => <RN.Text>{title}</RN.Text>,
    Button: ({ label, onPress }: { label: string; onPress: () => void }) => <RN.Pressable onPress={onPress}><RN.Text>{label}</RN.Text></RN.Pressable>,
  };
});

function item(id: number, over: Partial<BadgeItem> = {}): BadgeItem {
  return { id, code: `B${id}`, name: `Badge ${id}`, description: '', metric: 'QUIZ_COMPLETED', threshold: id, currentValue: 0, iconKey: 'clipboard-check', sortOrder: id, earned: false, earnedAt: null, seen: null, ...over };
}
function view(badges: BadgeItem[]): BadgesView {
  return { earnedCount: badges.filter(b => b.earned).length, totalCount: badges.length, unseenCount: badges.filter(b => b.seen === false).length, badges };
}
function mockData(data: BadgesView | undefined, extra: Record<string, unknown> = {}) {
  jest.mocked(useBadges).mockReturnValue({ data, isPending: !data, isError: false, refetch: jest.fn(), ...extra } as unknown as ReturnType<typeof useBadges>);
}

describe('achievements screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
    useBadgeSessionStore.setState({ shownIds: [], pendingSeenIds: [], request: null });
    jest.mocked(syncBadges).mockResolvedValue(null);
  });

  it('normal state shows the summary, progress per locked badge and no new pill', async () => {
    mockData(view([item(1, { earned: true, currentValue: 12, seen: true, earnedAt: '2026-10-01T00:00:00Z' }), item(10, { currentValue: 12, earned: true, seen: true, earnedAt: '2026-10-02T00:00:00Z' }), item(50, { currentValue: 12 })]));
    render(<AchievementsScreen />);
    expect(await screen.findByText('12 / 50')).toBeTruthy();
    expect(screen.getByText(/badges.summary.count/)).toBeTruthy();
    expect(screen.queryByText('badges.new_pill')).toBeNull();
  });

  it('recording state shows the banner when a threshold is reached but not recorded', async () => {
    mockData(view([item(1, { currentValue: 1 }), item(10, { currentValue: 1 })]));
    render(<AchievementsScreen />);
    expect(await screen.findByText('badges.recording_banner')).toBeTruthy();
  });

  it('introduces unseen badges in place and marks exactly the rendered snapshot as seen on blur (UI-BDG-03)', async () => {
    const unseen = [item(1, { earned: true, seen: false, currentValue: 12, earnedAt: '2026-10-07T00:00:00Z' }), item(10, { earned: true, seen: false, currentValue: 12, earnedAt: '2026-10-07T00:00:00Z' })];
    mockData(view([...unseen, item(50, { currentValue: 12 })]));
    const { rerender } = render(<AchievementsScreen />);
    expect(await screen.findAllByText('badges.new_pill')).toHaveLength(2);
    expect(useBadgeSessionStore.getState().shownIds).toEqual([1, 10]);

    // A badge synced after the screen lost focus must not be marked seen.
    act(() => focus.cleanup?.());
    mockData(view([...unseen, item(50, { earned: true, seen: false, currentValue: 50, earnedAt: '2026-10-07T00:00:00Z' })]));
    rerender(<AchievementsScreen />);
    expect(markBadgesSeen).toHaveBeenCalledTimes(1);
    expect(jest.mocked(markBadgesSeen).mock.calls[0][1]).toEqual([1, 10]);
  });

  it('shows the highlighted badges from the unlock modal without sending /seen again', async () => {
    mockParams = { highlight: '10' };
    mockData(view([item(1, { earned: true, seen: true, currentValue: 12, earnedAt: '2026-10-01T00:00:00Z' }), item(10, { earned: true, seen: true, currentValue: 12, earnedAt: '2026-10-07T00:00:00Z' })]));
    render(<AchievementsScreen />);
    expect(await screen.findAllByText('badges.new_pill')).toHaveLength(1);
    act(() => focus.cleanup?.());
    expect(markBadgesSeen).not.toHaveBeenCalled();
  });

  it('shows each badge reward and the rewards earned so far (PD-BDG-14)', async () => {
    const frame = { code: 'F', name: 'Khung Lửa', type: 'AVATAR_FRAME', previewUrl: null, granted: null };
    mockData({
      ...view([
        item(1, { earned: true, seen: true, currentValue: 12, earnedAt: '2026-10-01T00:00:00Z', reward: { coin: 20, xp: 50, item: null } }),
        item(50, { currentValue: 12, reward: { coin: 0, xp: 300, item: frame } }),
        item(60, { earned: true, seen: true, currentValue: 60, earnedAt: '2026-09-01T00:00:00Z', reward: null }),
      ]),
      rewardTotals: { coin: 20, xp: 50 },
    });
    render(<AchievementsScreen />);
    expect(await screen.findByText('+20')).toBeTruthy();
    expect(screen.getByText('+50')).toBeTruthy();
    expect(screen.getByText('+300')).toBeTruthy();
    expect(screen.getByText('badges.reward.frame_avatar')).toBeTruthy();
    expect(screen.getByText('badges.summary.rewards')).toBeTruthy();
    expect(screen.getByText('badges.reward.coin {"count":20}')).toBeTruthy();
    expect(screen.getByText('badges.reward.xp {"count":50}')).toBeTruthy();
  });

  it('shows a retry card when nothing is cached and the request fails', async () => {
    mockData(undefined, { isPending: false, isError: true });
    render(<AchievementsScreen />);
    expect(await screen.findByText('badges.error_title')).toBeTruthy();
    expect(screen.getByText('badges.retry')).toBeTruthy();
  });
});

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
jest.mock('@/components/snapvocab', () => ({ AchievementArtifact: () => null, AchievementGlow: () => null }));
jest.mock('@/components/ui/snapy', () => ({ Snapy: () => null }));
jest.mock('@/components/ui/icons', () => ({ CheckIcon: () => null, CheckCircleIcon: () => null, CloseIcon: () => null }));
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

  it('normal state has no recognition block and no call to action', async () => {
    mockData(view([item(1, { earned: true, currentValue: 12, seen: true, earnedAt: '2026-10-01T00:00:00Z' }), item(10, { currentValue: 12, earned: true, seen: true, earnedAt: '2026-10-02T00:00:00Z' }), item(50, { currentValue: 12 })]));
    render(<AchievementsScreen />);
    expect(await screen.findByText(/12\/50/)).toBeTruthy();
    expect(screen.queryByText(/badges.hero/)).toBeNull();
    expect(screen.queryByText(/badges.cta/)).toBeNull();
  });

  it('recording state replaces the empty-state invitation when a threshold is reached but not recorded', async () => {
    mockData(view([item(1, { currentValue: 1 }), item(10, { currentValue: 1 })]));
    render(<AchievementsScreen />);
    expect(await screen.findByText('badges.recording_banner')).toBeTruthy();
    expect(screen.queryByText('badges.hero.empty_title')).toBeNull();
  });

  it('introduces unseen badges in place and marks exactly the rendered snapshot as seen on blur (UI-BDG-03)', async () => {
    const unseen = [item(1, { earned: true, seen: false, currentValue: 12, earnedAt: '2026-10-07T00:00:00Z' }), item(10, { earned: true, seen: false, currentValue: 12, earnedAt: '2026-10-07T00:00:00Z' })];
    mockData(view([...unseen, item(50, { currentValue: 12 })]));
    const { rerender } = render(<AchievementsScreen />);
    expect(await screen.findByText(/badges.hero.new_many/)).toBeTruthy();
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
    expect(await screen.findByText('badges.hero.new_label')).toBeTruthy();
    act(() => focus.cleanup?.());
    expect(markBadgesSeen).not.toHaveBeenCalled();
  });

  it('shows a retry card when nothing is cached and the request fails', async () => {
    mockData(undefined, { isPending: false, isError: true });
    render(<AchievementsScreen />);
    expect(await screen.findByText('badges.error_title')).toBeTruthy();
    expect(screen.getByText('badges.retry')).toBeTruthy();
  });
});

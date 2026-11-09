import type { BadgesView } from '../types';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { markBadgesSeen, syncBadges, useBadges } from '../api';
import { BadgeUnlockHost } from '../badge-unlock-host';
import { useBadgeSessionStore } from '../use-badge-session-store';

let mockPath = '/';
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ usePathname: () => mockPath, useRouter: () => ({ push: mockPush }) }));
jest.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({}) }));
jest.mock('../api', () => ({ useBadges: jest.fn(), syncBadges: jest.fn(), markBadgesSeen: jest.fn() }));
jest.mock('../components/badge-unlock-modal', () => {
  const RN = require('react-native');
  return {
    BadgeUnlockModal: ({ items, intensity, onClose, onViewCollection }: { items: { name: string }[]; intensity: string; onClose: () => void; onViewCollection: () => void }) => (
      <RN.View>
        <RN.Text>{`modal:${intensity}:${items.map(i => i.name).join(',')}`}</RN.Text>
        <RN.Pressable onPress={onClose}><RN.Text>later</RN.Text></RN.Pressable>
        <RN.Pressable onPress={onViewCollection}><RN.Text>view</RN.Text></RN.Pressable>
      </RN.View>
    ),
  };
});

const data: BadgesView = {
  earnedCount: 1,
  totalCount: 2,
  unseenCount: 1,
  badges: [
    { id: 7, code: 'QUIZ_10', name: 'Quen Tay Quiz', description: '', metric: 'QUIZ_COMPLETED', threshold: 10, currentValue: 10, imageUrl: null, sortOrder: 21, earned: true, earnedAt: '2026-10-07T00:00:00Z', seen: false },
    { id: 8, code: 'QUIZ_50', name: 'Chiến Binh Quiz', description: '', metric: 'QUIZ_COMPLETED', threshold: 50, currentValue: 10, imageUrl: null, sortOrder: 22, earned: false, earnedAt: null, seen: null },
  ],
};

describe('badge unlock host', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useBadgeSessionStore.setState({ shownIds: [], pendingSeenIds: [], request: null });
    jest.mocked(useBadges).mockReturnValue({ data } as unknown as ReturnType<typeof useBadges>);
    jest.mocked(syncBadges).mockResolvedValue(null);
  });

  it('syncs on mount and waits on Quiz Result, then opens at the first eligible route (UI-BDG-01)', () => {
    mockPath = '/study/quiz-result';
    const { rerender } = render(<BadgeUnlockHost />);
    expect(syncBadges).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/^modal:/)).toBeNull();

    mockPath = '/learn';
    rerender(<BadgeUnlockHost />);
    expect(screen.getByText('modal:normal:Quen Tay Quiz')).toBeTruthy();

    fireEvent.press(screen.getByText('later'));
    expect(jest.mocked(markBadgesSeen).mock.calls[0][1]).toEqual([7]);
    expect(screen.queryByText(/^modal:/)).toBeNull();
  });

  it('never presents a badge twice in one session, even before /seen succeeds', () => {
    mockPath = '/';
    const { rerender } = render(<BadgeUnlockHost />);
    fireEvent.press(screen.getByText('later'));
    mockPath = '/profile';
    rerender(<BadgeUnlockHost />);
    expect(screen.queryByText(/^modal:/)).toBeNull();
  });

  it('opens at reduced intensity on an explicit request, even on a deferred route', () => {
    mockPath = '/study/quiz-result';
    render(<BadgeUnlockHost />);
    act(() => useBadgeSessionStore.getState().requestUnlock([7], 'reduced'));
    expect(screen.getByText('modal:reduced:Quen Tay Quiz')).toBeTruthy();
  });

  it('"view collection" marks seen and opens Achievements with the presented ids highlighted', () => {
    mockPath = '/';
    render(<BadgeUnlockHost />);
    fireEvent.press(screen.getByText('view'));
    expect(markBadgesSeen).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/profile/achievements', params: { highlight: '7' } });
  });
});

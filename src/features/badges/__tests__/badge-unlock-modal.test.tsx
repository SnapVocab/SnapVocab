import type { BadgesView } from '../types';
import { render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import * as React from 'react';
import { BadgeUnlockModal } from '../components/badge-unlock-modal';
import { buildSeries } from '../model';

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('lottie-react-native', () => {
  const RN = require('react-native');
  return (props: { testID?: string }) => <RN.View testID={props.testID} />;
});
jest.mock('@/components/snapvocab', () => ({ AchievementArtifact: () => null, AchievementGlow: () => null }));

const data: BadgesView = {
  earnedCount: 2,
  totalCount: 2,
  unseenCount: 1,
  badges: [
    { id: 7, code: 'QUIZ_10', name: 'Quen Tay Quiz', description: '', metric: 'QUIZ_COMPLETED', threshold: 10, currentValue: 50, iconKey: 'clipboard-check', sortOrder: 21, earned: true, earnedAt: '2026-10-07T00:00:00Z', seen: true },
    { id: 8, code: 'QUIZ_50', name: 'Chiến Binh Quiz', description: '', metric: 'QUIZ_COMPLETED', threshold: 50, currentValue: 50, iconKey: 'clipboard-check', sortOrder: 22, earned: true, earnedAt: '2026-10-22T00:00:00Z', seen: false },
  ],
};
const seriesList = buildSeries(data);
const [first, final] = data.badges;

function show(item: typeof first, intensity: 'normal' | 'reduced') {
  render(<BadgeUnlockModal items={[item]} seriesList={seriesList} intensity={intensity} onClose={jest.fn()} onViewCollection={jest.fn()} />);
}

describe('badge unlock modal P2 (achievements_ui.md §10, §11)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('says what the sync paid, summed over every badge shown, frame only when granted (PD-BDG-14)', () => {
    const frame = { code: 'F', name: 'Khung Chiến Binh', type: 'AVATAR_FRAME', previewUrl: null, granted: true };
    render(<BadgeUnlockModal items={[{ ...first, reward: { coin: 60, xp: 150, item: null } }, { ...final, reward: { coin: 0, xp: 300, item: frame } }]} seriesList={seriesList} intensity="normal" onClose={jest.fn()} onViewCollection={jest.fn()} />);
    expect(screen.getByText(/\+60 Coin · \+450 XP · Khung Chiến Binh/)).toBeTruthy();
  });

  it('has no reward line for badges without a reward', () => {
    show(first, 'normal');
    expect(screen.queryByText(/Bạn nhận|You got/)).toBeNull();
  });

  it('celebrates a series-final badge with confetti and one haptic tap', () => {
    show(final, 'normal');
    expect(screen.getByTestId('badge-confetti')).toBeTruthy();
    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
  });

  it('keeps confetti for the series final only, and off at reduced intensity', () => {
    show(first, 'normal');
    expect(screen.queryByTestId('badge-confetti')).toBeNull();
    show(final, 'reduced');
    expect(screen.queryByTestId('badge-confetti')).toBeNull();
  });
});

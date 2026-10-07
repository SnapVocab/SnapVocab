import type { ProgressSummaryDTO } from '../types';
import { cleanup, render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { AccuracyStatsCard, LearningStateCard, QuickOverviewRow } from '../components';
import { deriveVocabularySegments } from '../utils';

// The dormant SRS branches, exercised as they will run once the backend ships FSRS.
jest.mock('../utils', () => ({ ...jest.requireActual('../utils'), SRS_ENABLED: true }));
jest.mock('../api', () => ({ useProgressHistory: jest.fn() }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));
jest.mock('@/components/ui', () => {
  const RN = require('react-native');
  return {
    Text: RN.Text,
    Button: ({ label, onPress }: { label: string; onPress: () => void }) => <RN.Pressable accessibilityRole="button" onPress={onPress}><RN.Text>{label}</RN.Text></RN.Pressable>,
  };
});
jest.mock('@/components/snapvocab', () => ({
  XPOrb3D: require('react-native').View,
  StreakFlame3D: require('react-native').View,
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'vi' },
    t: (key: string, args: Record<string, unknown> = {}) => {
      const copy = require('@/translations/vi.json').progressUx[key.split('.').at(-1)!];
      if (!copy) {
        return key;
      }
      return copy.replace(/\{\{(\w+)\}\}/g, (_: string, name: string) => String(args[name] ?? ''));
    },
  }),
}));

function summaryOf(overrides: Partial<ProgressSummaryDTO>): ProgressSummaryDTO {
  return {
    totalWords: 0,
    learnedCount: 0,
    reviewingCount: 0,
    masteredCount: 0,
    dueCount: 0,
    accuracy: null,
    reviewCount: 0,
    completedQuizCount: 0,
    ...overrides,
  };
}

describe('progress UX with SRS enabled', () => {
  afterEach(cleanup);

  it.each([
    { totalWords: 5, learnedCount: 0, masteredCount: 0, expected: [5, 0, 0] },
    { totalWords: 5, learnedCount: 3, masteredCount: 0, expected: [2, 3, 0] },
    { totalWords: 10, learnedCount: 8, masteredCount: 0, expected: [2, 8, 0] },
    { totalWords: 10, learnedCount: 10, masteredCount: 6, expected: [0, 4, 6] },
  ])('segments never overlap: mastered ⊂ learned ($totalWords/$learnedCount/$masteredCount)', (c) => {
    const s = deriveVocabularySegments(c);
    expect([s.newCount, s.learningAndReviewingCount, s.masteredCount]).toEqual(c.expected);
    // The old Home bar drew mastered/total + learned/total side by side: 6 + 10 of 10 = 160%.
    expect(s.newCount + s.learningAndReviewingCount + s.masteredCount).toBe(c.totalWords);
    expect(s.isValidSum).toBe(true);
  });

  it('vocabulary card splits saved words into new / learning / mastered', () => {
    render(<LearningStateCard summary={summaryOf({ totalWords: 10, learnedCount: 10, masteredCount: 6 })} />);
    expect(screen.getByText('10 từ đã lưu')).toBeTruthy();
    expect(screen.getByText('Chưa học')).toBeTruthy();
    expect(screen.getByText('4')).toBeTruthy();
    expect(screen.getByText('6')).toBeTruthy();
  });

  it('due words still never get a "review now" CTA that opens a topic quiz', () => {
    render(<LearningStateCard summary={summaryOf({ totalWords: 5, learnedCount: 5, dueCount: 3 })} />);
    expect(screen.queryByText('Ôn tập ngay')).toBeNull();
  });

  it('quick overview shows the due count', () => {
    render(
      <QuickOverviewRow
        summary={summaryOf({ totalWords: 5, dueCount: 3 })}
        streak={{ currentStreak: 1, longestStreak: 1, lastStudiedDate: null }}
      />,
    );
    expect(screen.getByText('Cần ôn')).toBeTruthy();
  });

  it('performance shows the review count', () => {
    render(<AccuracyStatsCard summary={summaryOf({ reviewCount: 4 })} />);
    expect(screen.getByText('Lượt ôn')).toBeTruthy();
  });
});

import type { ProgressSummaryDTO, StreakDTO } from '../types';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { useProgressHistory } from '../api';
import {
  AccuracyStatsCard,
  ActivityHistoryChart,
  LearningStateCard,
  LevelOverviewCard,
  MascotAdviceCard,
  QuickOverviewRow,
  StreakStatsCard,
} from '../components';
import { SRS_ENABLED } from '../utils';

jest.mock('../api', () => ({ useProgressHistory: jest.fn() }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));
jest.mock('@/components/ui', () => ({
  Text: require('react-native').Text,
}));
jest.mock('@/components/snapvocab', () => ({
  XPOrb3D: require('react-native').View,
  StreakFlame3D: require('react-native').View,
}));
jest.mock('@/components/Snapy', () => ({
  Snapy: require('react-native').View,
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

function summaryOf(overrides: Partial<ProgressSummaryDTO> = {}): ProgressSummaryDTO {
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
function streakOf(overrides: Partial<StreakDTO> = {}): StreakDTO {
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastStudiedDate: null,
    ...overrides,
  };
}

function mockHistory(buckets: { periodStart: string; eventCount: number; activeDays: number }[]) {
  jest.mocked(useProgressHistory).mockReturnValue({
    data: { period: 'DAY', from: buckets[0]?.periodStart ?? '2026-10-01', to: '2026-10-10', buckets },
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useProgressHistory>);
}

describe('progress UX while the backend has no SRS lifecycle', () => {
  afterEach(cleanup);

  it('ships with SRS metrics switched off (no FsrsRecord writer on the backend)', () => {
    expect(SRS_ENABLED).toBe(false);
  });

  describe('srs-dependent metrics are not presented as real data', () => {
    it('vocabulary card shows the saved total and an honest unavailable note, not a state split', () => {
      render(<LearningStateCard summary={summaryOf({ totalWords: 5, dueCount: 3 })} />);
      expect(screen.getByText('5 từ đã lưu')).toBeTruthy();
      expect(screen.getByText(/ôn tập SRS\) sẽ có trong bản cập nhật sau/)).toBeTruthy();
      expect(screen.queryByText('Chưa học')).toBeNull();
      expect(screen.queryByText('Thành thạo')).toBeNull();
      expect(screen.queryByText('Ôn tập ngay')).toBeNull();
      expect(screen.getByText('Làm bài Quiz')).toBeTruthy();
    });

    it('vocabulary card with no words points to capturing words', () => {
      render(<LearningStateCard summary={summaryOf()} />);
      expect(screen.getByText('0 từ đã lưu')).toBeTruthy();
      expect(screen.getByText('Khám phá từ mới')).toBeTruthy();
    });

    it('quick overview shows completed quizzes instead of the due count', () => {
      render(
        <QuickOverviewRow
          summary={summaryOf({ totalWords: 4, dueCount: 9, completedQuizCount: 2 })}
          streak={streakOf({ currentStreak: 1 })}
        />,
      );
      expect(screen.getByText('Quiz hoàn thành')).toBeTruthy();
      expect(screen.getByText('2')).toBeTruthy();
      expect(screen.queryByText('Cần ôn')).toBeNull();
      expect(screen.queryByText('9')).toBeNull();
    });

    it('performance hides "Lượt ôn" and does not count reviews as data', () => {
      render(<AccuracyStatsCard summary={summaryOf({ reviewCount: 7 })} />);
      expect(screen.getByText('Chưa có dữ liệu hiệu suất')).toBeTruthy();
      expect(screen.getByText('Hoàn thành bài Quiz đầu tiên để theo dõi độ chính xác.')).toBeTruthy();
      expect(screen.queryByText('Lượt ôn')).toBeNull();
    });

    it('performance shows quiz accuracy and count when quizzes exist', () => {
      render(<AccuracyStatsCard summary={summaryOf({ accuracy: 0.8, completedQuizCount: 3 })} />);
      expect(screen.getByText('80%')).toBeTruthy();
      expect(screen.getByText('3')).toBeTruthy();
      expect(screen.queryByText('Lượt ôn')).toBeNull();
    });

    it('mascot never tells the learner words are due', () => {
      render(<MascotAdviceCard summary={summaryOf({ totalWords: 3, dueCount: 5 })} streak={streakOf()} />);
      expect(screen.queryByText(/cần ôn/)).toBeNull();
      expect(screen.getByText('Bạn đã lưu 3 từ!')).toBeTruthy();
      expect(screen.getByText('Hoàn thành một bài quiz hôm nay để bắt đầu chuỗi ngày học.')).toBeTruthy();
    });

    it('mascot generic tip uses real copy, not a raw i18n key', () => {
      render(<MascotAdviceCard summary={summaryOf({ totalWords: 3 })} streak={streakOf({ currentStreak: 2 })} />);
      expect(screen.getByText('Mẹo nhỏ từ Snapy')).toBeTruthy();
      expect(screen.queryByText(/progressUx\./)).toBeNull();
    });
  });

  describe('loading is not zero', () => {
    it('quick overview renders a skeleton, not zeros, while loading', () => {
      render(<QuickOverviewRow isLoading />);
      expect(screen.queryByText('0')).toBeNull();
      expect(screen.queryByText('Từ đã lưu')).toBeNull();
    });

    it('quick overview renders nothing (not zeros) when its data failed to load', () => {
      render(<QuickOverviewRow summary={undefined} streak={streakOf()} />);
      expect(screen.queryByText('0')).toBeNull();
    });
  });

  describe('streak semantics', () => {
    it('never studied: "not started" with the quiz-only rule', () => {
      render(<StreakStatsCard streak={streakOf()} />);
      expect(screen.getByText('Chuỗi ngày học')).toBeTruthy();
      expect(screen.getByText('Chưa bắt đầu · Hoàn thành một bài quiz hôm nay để bắt đầu chuỗi.')).toBeTruthy();
    });

    it('current 0 with a past record is an interrupted streak, not "not started"', () => {
      render(<StreakStatsCard streak={streakOf({ longestStreak: 12, lastStudiedDate: '2026-09-20' })} />);
      expect(screen.getByText('Chuỗi hiện tại đã gián đoạn')).toBeTruthy();
      expect(screen.getByText('Kỷ lục: 12 ngày · Hoàn thành một bài quiz để bắt đầu lại.')).toBeTruthy();
      expect(screen.queryByText(/Chưa bắt đầu/)).toBeNull();
    });

    it('active streak shows current and record', () => {
      render(<StreakStatsCard streak={streakOf({ currentStreak: 3, longestStreak: 9 })} />);
      expect(screen.getByText('3 ngày học liên tiếp')).toBeTruthy();
      expect(screen.getByText('Kỷ lục: 9 ngày')).toBeTruthy();
    });
  });

  describe('level states', () => {
    it('normal level', () => {
      render(
        <LevelOverviewCard
          xpOverview={{ totalXp: 0, level: { levelNumber: 1, title: 'Tập sự', minXp: 0, nextLevelXp: 100, progress: 0 }, recentEvents: [] }}
        />,
      );
      expect(screen.getByText('Cấp 1 · Tập sự')).toBeTruthy();
      expect(screen.getByText('0 / 100 XP')).toBeTruthy();
      expect(screen.getByText('Còn 100 XP đến cấp tiếp theo')).toBeTruthy();
    });

    it('max level', () => {
      render(
        <LevelOverviewCard
          xpOverview={{ totalXp: 5000, level: { levelNumber: 50, title: 'Huyền thoại', minXp: 5000, nextLevelXp: null, progress: 1 }, recentEvents: [] }}
        />,
      );
      expect(screen.getByText('Cấp 50 · Huyền thoại')).toBeTruthy();
      expect(screen.getByText('Bạn đã đạt cấp cao nhất hiện có.')).toBeTruthy();
      expect(screen.queryByText(/Còn.*XP/)).toBeNull();
    });

    it('level=null shows XP only and never invents a level', () => {
      render(<LevelOverviewCard xpOverview={{ totalXp: 45, level: null, recentEvents: [] }} />);
      expect(screen.getByText('45 XP')).toBeTruthy();
      expect(screen.getByText('Tích lũy XP khi hoàn thành bài quiz.')).toBeTruthy();
      expect(screen.queryByText(/Cấp \d/)).toBeNull();
      expect(screen.queryByText(/Tập sự/)).toBeNull();
    });

    it('loading renders a skeleton, not 0 XP', () => {
      render(<LevelOverviewCard isLoading />);
      expect(screen.queryByText(/XP/)).toBeNull();
    });
  });

  describe('activity history', () => {
    it('empty range renders the empty state and no bars', () => {
      mockHistory([{ periodStart: '2026-10-01', eventCount: 0, activeDays: 0 }]);
      render(<ActivityHistoryChart />);
      expect(screen.getByText('Chưa có hoạt động trong khoảng này')).toBeTruthy();
      expect(screen.getByText('Các bài quiz bạn hoàn thành sẽ xuất hiện tại đây.')).toBeTruthy();
      expect(screen.queryByTestId('history-bucket-2026-10-01')).toBeNull();
    });

    it('total and range describe only the visible bars, not the whole backend range', () => {
      // 10 daily buckets from the backend; the DAY view shows the last 7 (10-04 … 10-10).
      mockHistory(Array.from({ length: 10 }, (_, i) => ({
        periodStart: `2026-10-${String(i + 1).padStart(2, '0')}`,
        eventCount: i < 3 ? 100 : 1,
        activeDays: 1,
      })));
      render(<ActivityHistoryChart />);
      expect(screen.getByText('7 hoạt động trong khoảng này')).toBeTruthy();
      expect(screen.getByText('2026-10-04 – 2026-10-10')).toBeTruthy();
      expect(screen.queryByTestId('history-bucket-2026-10-03')).toBeNull();
      expect(screen.getByTestId('history-bucket-2026-10-04')).toBeTruthy();
    });

    it('activity only outside the visible window is an empty state, not a silent total', () => {
      mockHistory(Array.from({ length: 10 }, (_, i) => ({
        periodStart: `2026-10-${String(i + 1).padStart(2, '0')}`,
        eventCount: i === 0 ? 5 : 0,
        activeDays: i === 0 ? 1 : 0,
      })));
      render(<ActivityHistoryChart />);
      expect(screen.getByText('Chưa có hoạt động trong khoảng này')).toBeTruthy();
    });

    it('selecting a bar shows its detail', () => {
      mockHistory([
        { periodStart: '2026-10-01', eventCount: 3, activeDays: 1 },
        { periodStart: '2026-10-02', eventCount: 8, activeDays: 1 },
      ]);
      render(<ActivityHistoryChart />);
      expect(screen.getByText('11 hoạt động trong khoảng này')).toBeTruthy();
      fireEvent.press(screen.getByTestId('history-bucket-2026-10-02'));
      expect(screen.getByText('2026-10-02 · 8 hoạt động · 1 ngày học')).toBeTruthy();
    });

    it('error shows retry, not the empty state', () => {
      jest.mocked(useProgressHistory).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        refetch: jest.fn(),
      } as unknown as ReturnType<typeof useProgressHistory>);
      render(<ActivityHistoryChart />);
      expect(screen.getByText('Chưa tải được lịch sử.')).toBeTruthy();
      expect(screen.getByText('Thử lại')).toBeTruthy();
      expect(screen.queryByText('Chưa có hoạt động trong khoảng này')).toBeNull();
    });
  });
});

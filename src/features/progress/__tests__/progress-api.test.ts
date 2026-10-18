import type {
  HomeWidgetDTO,
  ProgressHistoryDTO,
  ProgressSummaryDTO,
  StreakDTO,
  XpOverviewDTO,
} from '../types';
import { client } from '@/lib/api';
import {
  getHomeWidget,
  getProgressHistory,
  getProgressSummary,
  getStreak,
  getXpOverview,
} from '../api';

jest.mock('@/lib/api', () => ({
  client: jest.fn(),
}));

const mockedClient = client as unknown as jest.Mock;

describe('progress and Gamification API Contracts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('gET /api/progress/summary (MH-STATS-01)', () => {
    it('fetches learning-state counts and accuracy', async () => {
      const mockSummary: ProgressSummaryDTO = {
        totalWords: 120,
        learnedCount: 65,
        reviewingCount: 30,
        masteredCount: 15,
        dueCount: 8,
        accuracy: 0.88,
        reviewCount: 42,
        completedQuizCount: 12,
      };

      mockedClient.mockResolvedValueOnce({
        data: {
          statusCode: 200,
          data: mockSummary,
          error: null,
        },
      });

      const result = await getProgressSummary();

      expect(mockedClient).toHaveBeenCalledWith({
        url: '/api/progress/summary',
        method: 'GET',
      });
      expect(result).toEqual(mockSummary);
      expect(result.dueCount).toBe(8);
      expect(result.accuracy).toBe(0.88);
    });
  });

  describe('gET /api/progress/streak (MH-STATS-01)', () => {
    it('fetches current and longest streaks', async () => {
      const mockStreak: StreakDTO = {
        currentStreak: 12,
        longestStreak: 25,
        lastStudiedDate: '2026-10-02',
      };

      mockedClient.mockResolvedValueOnce({
        data: {
          statusCode: 200,
          data: mockStreak,
          error: null,
        },
      });

      const result = await getStreak();

      expect(mockedClient).toHaveBeenCalledWith({
        url: '/api/progress/streak',
        method: 'GET',
      });
      expect(result.currentStreak).toBe(12);
      expect(result.longestStreak).toBe(25);
      expect(result.lastStudiedDate).toBe('2026-10-02');
    });
  });

  describe('gET /api/progress/history (MH-STATS-01)', () => {
    it('fetches learning activity with period and date filters', async () => {
      const mockHistory: ProgressHistoryDTO = {
        period: 'DAY',
        from: '2026-09-26',
        to: '2026-10-02',
        buckets: [
          { periodStart: '2026-09-26', eventCount: 10, activeDays: 1 },
          { periodStart: '2026-09-27', eventCount: 0, activeDays: 0 },
          { periodStart: '2026-09-28', eventCount: 15, activeDays: 1 },
        ],
      };

      mockedClient.mockResolvedValueOnce({
        data: {
          statusCode: 200,
          data: mockHistory,
          error: null,
        },
      });

      const result = await getProgressHistory('DAY', '2026-09-26', '2026-10-02');

      expect(mockedClient).toHaveBeenCalledWith({
        url: '/api/progress/history',
        method: 'GET',
        params: {
          period: 'DAY',
          from: '2026-09-26',
          to: '2026-10-02',
        },
      });
      expect(result.buckets).toHaveLength(3);
      expect(result.buckets[0].eventCount).toBe(10);
    });
  });

  describe('gET /api/progress/home-widget (MH-MAIN-01)', () => {
    it('fetches compact progress for Home dashboard', async () => {
      const mockWidget: HomeWidgetDTO = {
        totalWords: 150,
        learnedCount: 90,
        masteredCount: 30,
        dueCount: 5,
        currentStreak: 7,
      };

      mockedClient.mockResolvedValueOnce({
        data: {
          statusCode: 200,
          data: mockWidget,
          error: null,
        },
      });

      const result = await getHomeWidget();

      expect(mockedClient).toHaveBeenCalledWith({
        url: '/api/progress/home-widget',
        method: 'GET',
      });
      expect(result.dueCount).toBe(5);
      expect(result.currentStreak).toBe(7);
    });
  });

  describe('gET /api/gamification/xp (MH-STATS-02, Home)', () => {
    it('fetches total XP, level info, and recent XP events', async () => {
      const mockXp: XpOverviewDTO = {
        totalXp: 1850,
        level: {
          levelNumber: 8,
          title: 'Học Giả',
          minXp: 1500,
          nextLevelXp: 2200,
          progress: 0.5,
        },
        recentEvents: [
          {
            sourceType: 'QUIZ',
            amount: 20,
            createdAt: '2026-10-02T10:00:00Z',
          },
          {
            sourceType: 'FLASHCARD_REVIEW',
            amount: 10,
            createdAt: '2026-10-02T08:30:00Z',
          },
        ],
      };

      mockedClient.mockResolvedValueOnce({
        data: {
          statusCode: 200,
          data: mockXp,
          error: null,
        },
      });

      const result = await getXpOverview();

      expect(mockedClient).toHaveBeenCalledWith({
        url: '/api/gamification/xp',
        method: 'GET',
      });
      expect(result.totalXp).toBe(1850);
      expect(result.level?.levelNumber).toBe(8);
      expect(result.level?.progress).toBe(0.5);
      expect(result.recentEvents).toHaveLength(2);
    });
  });
});

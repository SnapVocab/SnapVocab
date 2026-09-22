import type { PaginationObject, QuizHistorySummaryResponse } from '../types';
import {
  filterQuizHistoryItems,
  formatQuizAccuracy,
  formatQuizDuration,
  formatQuizSubmittedDate,
} from '../utils';

describe('quiz-history feature and helper functions', () => {
  describe('formatQuizDuration', () => {
    it('formats 0 or negative duration correctly', () => {
      expect(formatQuizDuration(0)).toBe('0s');
      expect(formatQuizDuration(-100)).toBe('0s');
      expect(formatQuizDuration(null)).toBe('0s');
      expect(formatQuizDuration(undefined)).toBe('0s');
    });

    it('formats seconds only when under 1 minute', () => {
      expect(formatQuizDuration(45000)).toBe('45s');
      expect(formatQuizDuration(5000)).toBe('5s');
    });

    it('formats exact minutes with no seconds remainder', () => {
      expect(formatQuizDuration(60000)).toBe('1m');
      expect(formatQuizDuration(120000)).toBe('2m');
    });

    it('formats minutes and padded seconds', () => {
      expect(formatQuizDuration(65000)).toBe('1m 05s');
      expect(formatQuizDuration(154000)).toBe('2m 34s');
    });
  });

  describe('formatQuizAccuracy', () => {
    it('handles null/undefined gracefully', () => {
      expect(formatQuizAccuracy(null)).toBe(0);
      expect(formatQuizAccuracy(undefined)).toBe(0);
    });

    it('converts double accuracy (0..1) to whole percentage', () => {
      expect(formatQuizAccuracy(1.0)).toBe(100);
      expect(formatQuizAccuracy(0.85)).toBe(85);
      expect(formatQuizAccuracy(0.7333)).toBe(73);
      expect(formatQuizAccuracy(0)).toBe(0);
    });

    it('handles legacy bps (0..10000) gracefully as fallback', () => {
      expect(formatQuizAccuracy(10000)).toBe(100);
      expect(formatQuizAccuracy(8500)).toBe(85);
    });
  });

  describe('formatQuizSubmittedDate', () => {
    it('handles null or invalid string gracefully', () => {
      expect(formatQuizSubmittedDate(null)).toBe('');
      expect(formatQuizSubmittedDate(undefined)).toBe('');
      expect(formatQuizSubmittedDate('invalid-date')).toBe('');
    });

    it('formats valid ISO date string with day, month, year, hours, and minutes', () => {
      const formatted = formatQuizSubmittedDate('2026-09-19T07:30:00.000Z');
      expect(formatted).toMatch(/\d{2}:\d{2} · \d{2}\/\d{2}\/2026/);
    });
  });

  describe('quiz history payload contract & filtering', () => {
    const mockHistoryItems: QuizHistorySummaryResponse[] = [
      {
        quizId: 101,
        purpose: 'STANDARD',
        reviewOfQuizId: null,
        topicName: 'TOEFL Core',
        status: 'COMPLETED',
        mode: 'MCQ',
        questionCount: 10,
        correctCount: 9,
        incorrectCount: 1,
        unansweredCount: 0,
        accuracy: 0.9,
        createdAt: '2026-09-19T07:00:00.000Z',
        completedAt: '2026-09-19T07:05:00.000Z',
      },
      {
        quizId: 102,
        purpose: 'STANDARD',
        reviewOfQuizId: null,
        topicName: 'IELTS Academic',
        status: 'COMPLETED',
        mode: 'MATCHING',
        questionCount: 5,
        correctCount: 5,
        incorrectCount: 0,
        unansweredCount: 0,
        accuracy: 1.0,
        createdAt: '2026-09-19T07:15:00.000Z',
        completedAt: '2026-09-19T07:18:00.000Z',
      },
      {
        quizId: 103,
        purpose: 'REVIEW',
        reviewOfQuizId: 101,
        topicName: 'TOEFL Core',
        status: 'IN_PROGRESS',
        mode: 'FILL_BLANK',
        questionCount: 1,
        correctCount: 0,
        incorrectCount: 0,
        unansweredCount: 0,
        accuracy: 0,
        createdAt: '2026-09-19T07:30:00.000Z',
        completedAt: null,
      },
    ];

    it('filters items using filterQuizHistoryItems helper correctly', () => {
      expect(filterQuizHistoryItems(mockHistoryItems, 'ALL')).toHaveLength(3);
      const mcqItems = filterQuizHistoryItems(mockHistoryItems, 'MCQ');
      expect(mcqItems).toHaveLength(1);
      expect(mcqItems[0].quizId).toBe(101);

      const matchingItems = filterQuizHistoryItems(mockHistoryItems, 'MATCHING');
      expect(matchingItems).toHaveLength(1);
      expect(matchingItems[0].quizId).toBe(102);

      const fillBlankItems = filterQuizHistoryItems(mockHistoryItems, 'FILL_BLANK');
      expect(fillBlankItems).toHaveLength(1);
      expect(fillBlankItems[0].quizId).toBe(103);
    });

    it('calculates total correct answers across history items', () => {
      const totalCorrect = mockHistoryItems.reduce(
        (acc, item) => acc + item.correctCount,
        0,
      );
      expect(totalCorrect).toBe(14);
    });

    it('verifies PaginationObject page/size structure from backend', () => {
      const response: PaginationObject<QuizHistorySummaryResponse[]> = {
        data: mockHistoryItems,
        meta: {
          page: 0,
          size: 20,
          total: 3,
          pages: 1,
        },
      };

      expect(response.data).toHaveLength(3);
      expect(response.meta.page).toBe(0);
      expect(response.meta.pages).toBe(1);
    });
  });
});

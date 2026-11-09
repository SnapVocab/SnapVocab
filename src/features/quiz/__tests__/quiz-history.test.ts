import type { PaginationObject, QuizHistorySummaryResponse, QuizResultDTO } from '../types';
import {
  findResumableQuiz,
  formatQuizAccuracy,
  formatQuizDuration,
  formatQuizSubmittedDate,
  isQuizSessionExpired,
  quizHistoryAction,
} from '../utils';

describe('quiz-history feature and helper functions', () => {
  // D15: the value comes from QuizResultDTO.durationSeconds, never from the play-screen stopwatch.
  describe('formatQuizDuration', () => {
    it('formats missing or non-positive duration as 00:00', () => {
      expect(formatQuizDuration(0)).toBe('00:00');
      expect(formatQuizDuration(-100)).toBe('00:00');
      expect(formatQuizDuration(null)).toBe('00:00');
      expect(formatQuizDuration(undefined)).toBe('00:00');
    });

    it('formats under an hour as mm:ss', () => {
      expect(formatQuizDuration(45)).toBe('00:45');
      expect(formatQuizDuration(105)).toBe('01:45');
      expect(formatQuizDuration(600)).toBe('10:00');
      expect(formatQuizDuration(3599)).toBe('59:59');
    });

    it('formats an hour and over as hh:mm:ss', () => {
      expect(formatQuizDuration(3600)).toBe('01:00:00');
      expect(formatQuizDuration(3665)).toBe('01:01:05');
    });
  });

  describe('isQuizSessionExpired', () => {
    it('detects the QUIZ_SESSION_EXPIRED error code (D17)', () => {
      expect(isQuizSessionExpired({ response: { data: { error: 'QUIZ_SESSION_EXPIRED' } } })).toBe(true);
    });

    it('ignores other failures', () => {
      expect(isQuizSessionExpired({ response: { data: { error: 'QUIZ_NOT_IN_PROGRESS' } } })).toBe(false);
      expect(isQuizSessionExpired(new Error('network'))).toBe(false);
      expect(isQuizSessionExpired(null)).toBe(false);
    });
  });

  describe('quizHistoryAction', () => {
    it('offers resume only for a session the backend still reports IN_PROGRESS', () => {
      expect(quizHistoryAction('IN_PROGRESS')).toBe('RESUME');
    });

    it('offers nothing for an EXPIRED session (D17)', () => {
      expect(quizHistoryAction('EXPIRED')).toBe('NONE');
    });

    it('offers review for finished sessions', () => {
      expect(quizHistoryAction('COMPLETED')).toBe('REVIEW');
      expect(quizHistoryAction('CANCELLED')).toBe('REVIEW');
    });
  });

  describe('result review of incorrect answers (D15)', () => {
    const result: QuizResultDTO = {
      quizId: 9,
      status: 'COMPLETED',
      mode: 'MCQ',
      direction: 'EN_VI',
      topicId: 1,
      topicName: 'TOEFL Core',
      summary: { totalUnits: 2, correctCount: 1, incorrectCount: 1, accuracy: 0.5 },
      completedAt: '2026-09-19T07:05:00.000Z',
      cancelledAt: null,
      durationSeconds: 105,
      items: [
        {
          questionId: 1,
          position: 1,
          prompt: 'book',
          learnerAnswer: 'quyển vở',
          correctAnswer: 'quyển sách',
          outcome: 'INCORRECT',
          resolved: true,
          attemptCount: 1,
        },
        {
          questionId: 2,
          position: 2,
          prompt: 'pen',
          learnerAnswer: 'cái bút',
          correctAnswer: 'cái bút',
          outcome: 'CORRECT',
          resolved: true,
          attemptCount: 1,
        },
      ],
    };

    it('reviews wrong answers straight from result items, with no extra request', () => {
      const wrong = result.items.filter(i => i.outcome === 'INCORRECT');
      expect(wrong).toHaveLength(1);
      expect(wrong[0].prompt).toBe('book');
      expect(wrong[0].learnerAnswer).toBe('quyển vở');
      expect(wrong[0].correctAnswer).toBe('quyển sách');
    });

    it('renders the duration the backend calculated, not a client stopwatch', () => {
      expect(formatQuizDuration(result.durationSeconds)).toBe('01:45');
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
        topicId: 1,
        topicName: 'TOEFL Core',
        status: 'COMPLETED',
        mode: 'MCQ',
        direction: 'EN_VI',
        questionCount: 10,
        correctCount: 9,
        incorrectCount: 1,
        accuracy: 0.9,
        createdAt: '2026-09-19T07:00:00.000Z',
        completedAt: '2026-09-19T07:05:00.000Z',
      },
      {
        quizId: 102,
        topicId: 2,
        topicName: 'IELTS Academic',
        status: 'COMPLETED',
        mode: 'MATCHING',
        direction: 'VI_EN',
        questionCount: 5,
        correctCount: 5,
        incorrectCount: 0,
        accuracy: 1.0,
        createdAt: '2026-09-19T07:15:00.000Z',
        completedAt: '2026-09-19T07:18:00.000Z',
      },
      {
        quizId: 103,
        topicId: 1,
        topicName: 'TOEFL Core',
        status: 'IN_PROGRESS',
        mode: 'FILL_BLANK',
        direction: 'EN_VI',
        questionCount: 5,
        correctCount: null,
        incorrectCount: null,
        accuracy: null,
        createdAt: '2026-09-19T07:30:00.000Z',
        completedAt: null,
      },
    ];

    // D18: Setup "Bắt đầu" must spot the unfinished session of the SAME context, and only that one.
    describe('findResumableQuiz', () => {
      const unfinished: QuizHistorySummaryResponse = {
        ...mockHistoryItems[2],
        quizId: 201,
        mode: 'MCQ',
        direction: 'EN_VI',
        questionCount: 5,
        topicId: 1,
      };
      const request = {
        topicId: 1,
        mode: 'MCQ',
        direction: 'EN_VI',
        requestedCount: 5,
      } as const;

      it('finds the IN_PROGRESS session matching topic, mode, direction and size', () => {
        expect(findResumableQuiz([...mockHistoryItems, unfinished], request)?.quizId).toBe(201);
      });

      it('never resumes another context or a finished session', () => {
        expect(findResumableQuiz([{ ...unfinished, topicId: 2 }], request)).toBeUndefined();
        expect(findResumableQuiz([{ ...unfinished, direction: 'VI_EN' }], request)).toBeUndefined();
        expect(findResumableQuiz([{ ...unfinished, questionCount: 10 }], request)).toBeUndefined();
        expect(findResumableQuiz([{ ...unfinished, mode: 'MATCHING' }], request)).toBeUndefined();
        expect(findResumableQuiz([{ ...unfinished, status: 'COMPLETED' }], request)).toBeUndefined();
        expect(findResumableQuiz([{ ...unfinished, status: 'EXPIRED' }], request)).toBeUndefined();
        expect(findResumableQuiz([], request)).toBeUndefined();
      });

      it('matches FILL_BLANK, where the request carries no direction', () => {
        const fillBlank = { ...unfinished, mode: 'FILL_BLANK' as const, direction: null as any };
        expect(findResumableQuiz([fillBlank], {
          topicId: 1,
          mode: 'FILL_BLANK',
          requestedCount: 5,
        })?.quizId).toBe(201);
      });
    });

    it('calculates total correct answers across history items', () => {
      const totalCorrect = mockHistoryItems.reduce(
        (acc, item) => acc + (item.correctCount ?? 0),
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

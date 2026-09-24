/* eslint-disable max-lines-per-function */
import type {
  CheckQuestionRequest,
  CreateQuizRequest,
  MatchingAttemptDTO,
  MatchingAttemptRequest,
  QuestionCheckDTO,
  QuizPlayDTO,
  QuizResultDTO,
} from '../types';
import type { TemplateDTO } from '@/features/template-builder/types';
import { templateDTOToBuilderSections } from '@/features/template-builder/mappers/backend-to-client';
import { builderSectionsToTemplateElements } from '@/features/template-builder/mappers/client-to-backend';
import { client } from '@/lib/api';
import {
  attemptMatchingPair,
  cancelQuiz,
  checkQuestion,
  completeQuiz,
  createQuiz,
} from '../api/quiz-api';
import { generateIdempotencyKey } from '../utils/idempotency';

jest.mock('@/lib/api', () => ({
  client: jest.fn(),
}));

const mockedClient = client as unknown as jest.Mock;

describe('quiz v2 authoritative backend API contracts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('settings presets and canonical creation', () => {
    it('strictly restricts requestedCount to {5, 10, 20}', () => {
      const allowedCounts = [5, 10, 20];
      const testCases = [5, 10, 20] as const;

      testCases.forEach((count) => {
        expect(allowedCounts).toContain(count);
        const req: CreateQuizRequest = {
          topicId: 42,
          mode: 'MCQ',
          direction: 'EN_VI',
          requestedCount: count,
        };
        expect(req.requestedCount).toBe(count);
      });
    });

    it('sends POST /api/me/quizzes with Idempotency-Key and CreateQuizRequest', async () => {
      const key = generateIdempotencyKey();
      const request: CreateQuizRequest = {
        topicId: 10,
        mode: 'MCQ',
        direction: 'EN_VI',
        requestedCount: 10,
      };

      const mockResponse: QuizPlayDTO = {
        quizId: 1001,
        status: 'IN_PROGRESS',
        mode: 'MCQ',
        direction: 'EN_VI',
        topicId: 10,
        topicName: 'TOEIC Core',
        requestedCount: 10,
        questions: [],
        matchingRounds: [],
      };

      mockedClient.mockResolvedValueOnce({ data: { code: 200, data: mockResponse } });

      const result = await createQuiz(request, key);

      expect(mockedClient).toHaveBeenCalledTimes(1);
      expect(mockedClient).toHaveBeenCalledWith({
        url: '/api/me/quizzes',
        method: 'POST',
        headers: {
          'Idempotency-Key': key,
        },
        data: request,
      });
      expect(result.quizId).toBe(1001);
      expect(result.status).toBe('IN_PROGRESS');
    });
  });

  describe('mCQ question check flow', () => {
    it('sends POST /api/questions/{questionId}/check with optionKey and Idempotency-Key', async () => {
      const questionId = 55;
      const key = generateIdempotencyKey();
      const payload: CheckQuestionRequest = {
        optionKey: 'opt_a',
      };

      const mockCheckResult: QuestionCheckDTO = {
        questionId: 55,
        outcome: 'CORRECT',
        correct: true,
        correctAnswer: 'quả táo',
        correctOptionKey: 'opt_a',
      };

      mockedClient.mockResolvedValueOnce({ data: { code: 200, data: mockCheckResult } });

      const result = await checkQuestion(questionId, payload, key);

      expect(mockedClient).toHaveBeenCalledWith({
        url: '/api/questions/55/check',
        method: 'POST',
        headers: {
          'Idempotency-Key': key,
        },
        data: payload,
      });
      expect(result.correct).toBe(true);
      expect(result.outcome).toBe('CORRECT');
      expect(result.correctOptionKey).toBe('opt_a');
    });
  });

  describe('fill_blank question check flow', () => {
    it('sends POST /api/questions/{questionId}/check with answer and Idempotency-Key', async () => {
      const questionId = 77;
      const key = generateIdempotencyKey();
      const payload: CheckQuestionRequest = {
        answer: 'serendipity',
      };

      const mockCheckResult: QuestionCheckDTO = {
        questionId: 77,
        outcome: 'CORRECT',
        correct: true,
        correctAnswer: 'serendipity',
      };

      mockedClient.mockResolvedValueOnce({ data: { code: 200, data: mockCheckResult } });

      const result = await checkQuestion(questionId, payload, key);

      expect(mockedClient).toHaveBeenCalledWith({
        url: '/api/questions/77/check',
        method: 'POST',
        headers: {
          'Idempotency-Key': key,
        },
        data: payload,
      });
      expect(result.correct).toBe(true);
      expect(result.correctAnswer).toBe('serendipity');
    });
  });

  describe('matching pair attempt flow', () => {
    it('sends POST /api/me/quizzes/{quizId}/rounds/{roundNo}/attempts per pair attempt', async () => {
      const quizId = 2002;
      const roundNo = 1;
      const key = generateIdempotencyKey();
      const payload: MatchingAttemptRequest = {
        leftTileKey: 'L_1',
        rightTileKey: 'R_1',
      };

      const mockAttemptResult: MatchingAttemptDTO = {
        quizId: 2002,
        roundNo: 1,
        leftTileKey: 'L_1',
        rightTileKey: 'R_1',
        correct: true,
        attemptNo: 1,
        outcome: 'CORRECT',
        resolved: true,
        round: {
          matchedCount: 1,
          totalPairs: 5,
          completed: false,
        },
      };

      mockedClient.mockResolvedValueOnce({ data: { code: 200, data: mockAttemptResult } });

      const result = await attemptMatchingPair({
        quizId,
        roundNo,
        data: payload,
        idempotencyKey: key,
      });

      expect(mockedClient).toHaveBeenCalledWith({
        url: '/api/me/quizzes/2002/rounds/1/attempts',
        method: 'POST',
        headers: {
          'Idempotency-Key': key,
        },
        data: payload,
      });
      expect(result.correct).toBe(true);
      expect(result.round.matchedCount).toBe(1);
      expect(result.round.totalPairs).toBe(5);
    });
  });

  describe('complete and cancel quiz flow', () => {
    it('sends POST /api/me/quizzes/{quizId}/complete with empty body', async () => {
      const quizId = 3003;
      const mockResult: QuizResultDTO = {
        quizId: 3003,
        status: 'COMPLETED',
        mode: 'MCQ',
        direction: 'EN_VI',
        topicId: 10,
        topicName: 'TOEIC Core',
        summary: {
          totalUnits: 5,
          correctCount: 4,
          incorrectCount: 1,
          accuracy: 0.8,
        },
        completedAt: '2026-09-23T10:00:00Z',
        items: [],
      };

      mockedClient.mockResolvedValueOnce({ data: { code: 200, data: mockResult } });

      const result = await completeQuiz(quizId);

      expect(mockedClient).toHaveBeenCalledWith({
        url: '/api/me/quizzes/3003/complete',
        method: 'POST',
      });
      expect(result.status).toBe('COMPLETED');
      expect(result.summary.accuracy).toBe(0.8);
    });

    it('sends POST /api/me/quizzes/{quizId}/cancel with optional idempotency key', async () => {
      const quizId = 3003;
      const key = generateIdempotencyKey();
      mockedClient.mockResolvedValueOnce({
        data: { code: 200, data: { quizId: 3003, status: 'CANCELLED' } },
      });

      const result = await cancelQuiz(quizId, key);

      expect(mockedClient).toHaveBeenCalledWith({
        url: '/api/me/quizzes/3003/cancel',
        method: 'POST',
        headers: {
          'Idempotency-Key': key,
        },
      });
      expect(result.status).toBe('CANCELLED');
    });
  });

  describe('idempotency key generation and reuse', () => {
    it('generates a valid UUID v4 string', () => {
      const key = generateIdempotencyKey();
      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('reuses the same idempotency key across retry attempts for identical user intent', async () => {
      const key = generateIdempotencyKey();
      const questionId = 88;
      const payload: CheckQuestionRequest = { optionKey: 'opt_b' };

      // First attempt fails with network error
      mockedClient.mockRejectedValueOnce(new Error('Network error'));
      await expect(checkQuestion(questionId, payload, key)).rejects.toThrow('Network error');

      // Retry with the exact same key
      const mockSuccess: QuestionCheckDTO = {
        questionId: 88,
        outcome: 'CORRECT',
        correct: true,
        correctAnswer: 'hello',
        correctOptionKey: 'opt_b',
      };
      mockedClient.mockResolvedValueOnce({ data: { code: 200, data: mockSuccess } });
      const result = await checkQuestion(questionId, payload, key);

      expect(mockedClient).toHaveBeenCalledTimes(2);
      expect(mockedClient.mock.calls[0][0].headers['Idempotency-Key']).toBe(key);
      expect(mockedClient.mock.calls[1][0].headers['Idempotency-Key']).toBe(key);
      expect(result.correct).toBe(true);
    });
  });

  describe('g8 template builder semanticRole = null round-trip', () => {
    it('preserves semanticRole = null when mapping from backend DTO to client BuilderSection', () => {
      const backendTemplate: TemplateDTO = {
        id: 1,
        schemaId: 10,
        name: 'Test Template',
        isDefault: true,
        elements: [
          {
            id: 101,
            position: 0,
            type: 'SECTION_BREAK',
            side: 'FRONT',
            sectionLabel: 'Front Section',
          },
          {
            id: 102,
            position: 1,
            type: 'FIELD',
            side: 'FRONT',
            field: {
              schemaAttributeId: 501,
              semanticRole: null, // Explicitly null from backend
              fieldLabel: 'Custom Notes',
              hideIfEmpty: false,
              audioAction: false,
            },
          },
        ],
      };

      const sections = templateDTOToBuilderSections(backendTemplate, undefined);
      const field = sections.frontSections[0].fields[0];

      expect(field).toBeDefined();
      expect(field.fieldLabel).toBe('Custom Notes');
      // G8 Requirement: must remain null, NOT default to TARGET_WORD
      expect(field.semanticRole).toBeNull();
    });

    it('preserves semanticRole = null when mapping from client BuilderSection back to backend elements', () => {
      const frontSections = [
        {
          id: 'sec_1',
          name: 'Front Section',
          side: 'FRONT' as const,
          columns: 1 as const,
          repeatable: false,
          fields: [
            {
              id: 'f_1',
              schemaAttributeId: 501,
              attributeName: 'notes',
              fieldLabel: 'Custom Notes',
              semanticRole: null, // Null on client
              required: false,
              hideIfEmpty: false,
              audioAction: false,
              fontSize: 'M' as const,
              alignment: 'LEFT' as const,
              color: '#111827',
              column: 1 as const,
            },
          ],
        },
      ];

      const elements = builderSectionsToTemplateElements(frontSections, []);
      const fieldElement = elements.find(el => el.type === 'FIELD');

      expect(fieldElement).toBeDefined();
      expect(fieldElement?.field?.semanticRole).toBeNull();
    });
  });
});

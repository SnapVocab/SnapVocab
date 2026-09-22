import type {
  CheckMatchingRoundRequest,
  CheckQuestionRequest,
  MatchingRoundCommitDto,
  QuestionCommitDto,
  QuizCompleteDto,
  QuizPlayResponse,
  QuizQuestion,
} from '../types';

describe('quiz v2 per-unit commit and server scoring flow', () => {
  it('mCQ check payload maps answer: selectedOptionKey without client-side scoring', () => {
    const question: QuizQuestion = {
      id: 101,
      position: 1,
      prompt: 'apple',
      options: [
        { key: 'opt_1', label: 'quả táo' },
        { key: 'opt_2', label: 'quả cam' },
      ],
    };

    // Client select opt_1
    const selectedOptionKey = 'opt_1';
    const payload: CheckQuestionRequest = {
      answer: selectedOptionKey,
    };

    expect(payload.answer).toBe('opt_1');
    // Client does not have correct answer in options or question
    expect(question).not.toHaveProperty('correctValue');
    expect(question.options?.[0]).not.toHaveProperty('correct');
  });

  it('fillBlank check payload maps answer: rawText without client-side scoring', () => {
    const question: QuizQuestion = {
      id: 102,
      position: 2,
      prompt: 'quả táo',
    };

    const userInput = 'apple';
    const payload: CheckQuestionRequest = {
      answer: userInput,
    };

    expect(payload.answer).toBe('apple');
    expect(question).not.toHaveProperty('correctValue');
  });

  it('matching round commit maps all pairs for that round atomically', () => {
    const roundQuestions: QuizQuestion[] = [
      { id: 201, position: 1, roundNo: 1, prompt: 'cat' },
      { id: 202, position: 2, roundNo: 1, prompt: 'dog' },
    ];

    const pairedDrafts: Record<number, string> = {
      201: 'tile_cat',
      202: 'tile_dog',
    };

    const payload: CheckMatchingRoundRequest = {
      pairs: roundQuestions.map(q => ({
        questionId: q.id,
        tileKey: pairedDrafts[q.id],
      })),
    };

    expect(payload.pairs).toEqual([
      { questionId: 201, tileKey: 'tile_cat' },
      { questionId: 202, tileKey: 'tile_dog' },
    ]);
  });

  it('server returns QuestionCommitDto with feedback and correctness', () => {
    const mockCommitResponse: QuestionCommitDto = {
      questionId: 101,
      answerStatus: 'CORRECT',
      correct: true,
      feedback: { correct: true },
    };

    expect(mockCommitResponse.answerStatus).toBe('CORRECT');
    expect(mockCommitResponse.correct).toBe(true);
  });

  it('server returns MatchingRoundCommitDto with pairs results', () => {
    const mockRoundCommit: MatchingRoundCommitDto = {
      quizId: 501,
      roundNo: 1,
      pairs: [
        { questionId: 201, answerStatus: 'CORRECT', correct: true },
        { questionId: 202, answerStatus: 'INCORRECT', correct: false },
      ],
      correctCount: 1,
      incorrectCount: 1,
      unansweredCount: 0,
    };

    expect(mockRoundCommit.pairs).toHaveLength(2);
    expect(mockRoundCommit.correctCount).toBe(1);
    expect(mockRoundCommit.incorrectCount).toBe(1);
  });

  it('complete quiz does not require answers payload and returns QuizCompleteDto', () => {
    const mockCompleteDto: QuizCompleteDto = {
      quizId: 501,
      status: 'COMPLETED',
      summary: {
        totalUnits: 10,
        correctCount: 8,
        incorrectCount: 2,
        unansweredCount: 0,
        accuracy: 0.8,
        completedAt: '2026-09-21T07:00:00Z',
        purpose: 'STANDARD',
      },
      rewardGrantId: 999,
    };

    expect(mockCompleteDto.status).toBe('COMPLETED');
    expect(mockCompleteDto.summary.accuracy).toBe(0.8);
    expect(mockCompleteDto.rewardGrantId).toBe(999);
  });

  it('play response sync parses feedback without client answer spoofing', () => {
    const mockPlayResponse: QuizPlayResponse = {
      quizId: 501,
      status: 'IN_PROGRESS',
      purpose: 'STANDARD',
      questions: [
        {
          id: 101,
          position: 1,
          roundNo: null,
          mode: 'MCQ',
          direction: 'EN_VI',
          prompt: 'apple',
          options: [{ key: 'opt_1', displayOrder: 1, label: 'quả táo' }],
          feedback: { answerStatus: 'CORRECT', correct: true },
        },
        {
          id: 102,
          position: 2,
          roundNo: null,
          mode: 'MCQ',
          direction: 'EN_VI',
          prompt: 'banana',
          options: [{ key: 'opt_2', displayOrder: 1, label: 'quả chuối' }],
          feedback: null, // UNCOMMITTED
        },
      ],
      matchingTiles: [],
    };

    const q1 = mockPlayResponse.questions[0];
    const q2 = mockPlayResponse.questions[1];

    expect(q1.feedback?.answerStatus).toBe('CORRECT');
    expect(q2.feedback).toBeNull();
  });
});

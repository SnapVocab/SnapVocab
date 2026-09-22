export type QuizMode = 'MCQ' | 'MULTIPLE_CHOICE' | 'MATCHING' | 'FILL_BLANK';

export type QuizDirection = 'EN_VI' | 'VI_EN';

export type QuizStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

export type QuizPurpose = 'STANDARD' | 'REVIEW';

export type QuizAnswerStatus = 'UNCOMMITTED' | 'CORRECT' | 'INCORRECT' | 'UNANSWERED';

export type QuizOption = {
  key: string;
  displayOrder?: number;
  label: string;
};

export type QuizTile = {
  roundNo: number;
  key: string;
  displayOrder?: number;
  label: string;
};

export type QuizFeedback = {
  answerStatus: QuizAnswerStatus;
  correct: boolean | null;
  selectedOptionKey?: string | null;
  correctOptionKey?: string | null;
};

export type QuizQuestion = {
  id: number;
  position: number;
  roundNo?: number | null;
  mode?: QuizMode;
  direction?: QuizDirection;
  prompt: string;
  hint?: string | null;
  options?: QuizOption[];
  feedback?: QuizFeedback | null;
};

export type MatchingRound = {
  roundNo: number;
  questions: QuizQuestion[];
  tiles: QuizTile[];
};

export type QuizSummarySnapshot = {
  totalUnits?: number;
  questionCount?: number;
  correctCount?: number;
  incorrectCount?: number;
  unansweredCount?: number;
  accuracy?: number; // 0..1 from server
  completedAt?: string;
  purpose?: string;
  [key: string]: any;
};

// ---------------------------------------------------------------------------
// API Request & Response DTOs
// ---------------------------------------------------------------------------

export type CreateQuizRequest = {
  topicId: number;
  mode: QuizMode;
  direction: QuizDirection;
  requestedCount: number;
};

export type QuizPlayQuestionDto = {
  id: number;
  position: number;
  roundNo: number | null;
  mode: string;
  direction: string;
  sourceSnapshot?: Record<string, any>;
  promptSnapshot: string;
  options: {
    key: string;
    displayOrder: number;
    label: string;
  }[];
};

export type QuizPlayTileDto = {
  roundNo: number;
  key: string;
  displayOrder: number;
  label: string;
};

export type QuizPlayDto = {
  quizId: number;
  status: QuizStatus;
  questions: QuizPlayQuestionDto[];
  matchingTiles: QuizPlayTileDto[];
};

export type QuizQuestionPlayResponseDto = {
  id: number;
  position: number;
  roundNo: number | null;
  mode: string;
  direction: string;
  prompt: string;
  options: {
    key: string;
    displayOrder: number;
    label: string;
  }[];
  feedback: {
    answerStatus: string;
    correct: boolean | null;
    selectedOptionKey?: string | null;
    correctOptionKey?: string | null;
  } | null;
};

export type QuizPlayResponse = {
  quizId: number;
  status: QuizStatus;
  purpose: QuizPurpose;
  questions: QuizQuestionPlayResponseDto[];
  matchingTiles: QuizPlayTileDto[];
};

export type CheckQuestionRequest = {
  answer: string;
};

export type QuestionCommitDto = {
  questionId: number;
  answerStatus: QuizAnswerStatus;
  correct: boolean;
  feedback: Record<string, any>;
};

export type CheckMatchingRoundRequest = {
  pairs: {
    questionId: number;
    tileKey: string;
  }[];
};

export type MatchingRoundPairResult = {
  questionId: number;
  answerStatus: QuizAnswerStatus;
  correct: boolean;
};

export type MatchingRoundCommitDto = {
  quizId: number;
  roundNo: number;
  pairs: MatchingRoundPairResult[];
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
};

export type QuizCompleteDto = {
  quizId: number;
  status: QuizStatus;
  summary: QuizSummarySnapshot;
  rewardGrantId: number | null;
};

export type QuizLifecycleDto = {
  quizId: number;
  status: QuizStatus;
};

export type QuizResultResponse = {
  quizId: number;
  status: QuizStatus;
  purpose: QuizPurpose;
  reviewOfQuizId: number | null;
  summary: QuizSummarySnapshot;
  outcomes: QuizFeedback[];
};

export type QuizHistorySummaryResponse = {
  quizId: number;
  purpose: QuizPurpose;
  reviewOfQuizId: number | null;
  topicName: string;
  status: QuizStatus;
  mode: QuizMode;
  questionCount: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  accuracy: number; // 0..1
  createdAt: string;
  completedAt: string | null;
};

export type PaginationMeta = {
  page: number;
  size: number;
  total: number;
  pages: number;
};

export type PaginationObject<T> = {
  data: T;
  meta: PaginationMeta;
  schema?: any;
};

/** LISTENING: hear the English word, pick its spelling among words that sound alike. */
export type QuizMode = 'MCQ' | 'MATCHING' | 'FILL_BLANK' | 'LISTENING';

export type QuizDirection = 'EN_VI' | 'VI_EN';

/** EXPIRED = system closed an unfinished session on its 24h TTL (D17), not a learner cancel. */
export type QuizStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

export type QuizOutcome = 'UNCOMMITTED' | 'CORRECT' | 'INCORRECT';

export type QuizErrorCode
  = | 'INVALID_REQUEST'
    | 'IDEMPOTENCY_KEY_REQUIRED'
    | 'QUIZ_NOT_FOUND'
    | 'QUESTION_ALREADY_CHECKED'
    | 'MATCHING_LEFT_ALREADY_RESOLVED'
    | 'MATCHING_TILE_ALREADY_MATCHED'
    | 'QUIZ_NOT_IN_PROGRESS'
    | 'QUIZ_HAS_UNRESOLVED_UNITS'
    | 'QUIZ_NOT_FINISHED'
    | 'TOPIC_TEMPLATE_NOT_CONFIGURED'
    | 'SEMANTIC_ROLE_NOT_BOUND'
    | 'SEMANTIC_ROLE_AMBIGUOUS'
    | 'QUIZ_INSUFFICIENT_ELIGIBLE_ITEMS'
    | 'NOT_ENOUGH_DISTINCT_ANSWERS'
    | 'INVALID_OPTION'
    | 'INVALID_MATCHING_PAIR'
    | 'QUIZ_SESSION_EXPIRED';

export type QuizErrorData = {
  requestedCount?: number;
  eligibleCount?: number;
  allowedCounts?: number[];
  semanticRole?: string;
  unresolvedCount?: number;
  [key: string]: unknown;
};

// ---------------------------------------------------------------------------
// 1. Create Quiz Request
// ---------------------------------------------------------------------------

export type CreateQuizRequest = {
  topicId: number;
  mode: QuizMode;
  direction?: QuizDirection;
  requestedCount: 5 | 10 | 20;
};

// ---------------------------------------------------------------------------
// 2. Play / Session DTOs
// ---------------------------------------------------------------------------

export type QuizPlayOption = {
  key: string;
  label: string;
  displayOrder: number;
};

export type QuizPlayQuestion = {
  questionId: number;
  position: number;
  prompt: string;
  options: QuizPlayOption[];
  outcome: QuizOutcome;
  resolved: boolean;
};

export type QuizPlayLeftTile = {
  key: string;
  label: string;
  displayOrder: number;
  questionId: number;
  outcome: QuizOutcome;
  resolved: boolean;
  attemptCount: number;
};

export type QuizPlayRightTile = {
  key: string;
  label: string;
  displayOrder: number;
  matched: boolean;
};

export type QuizPlayMatchingRound = {
  roundNo: number;
  totalPairs: number;
  matchedCount: number;
  completed: boolean;
  leftTiles: QuizPlayLeftTile[];
  rightTiles: QuizPlayRightTile[];
};

export type QuizPlayDTO = {
  quizId: number;
  status: QuizStatus;
  mode: QuizMode;
  /** Null for FILL_BLANK and LISTENING, which have no direction. */
  direction: QuizDirection | null;
  topicId: number;
  topicName: string;
  requestedCount: number;
  questions: QuizPlayQuestion[];
  matchingRounds: QuizPlayMatchingRound[];
};

// Backward-compat aliases
export type QuizPlayDto = QuizPlayDTO;

// ---------------------------------------------------------------------------
// 3. Question Check (MCQ, LISTENING & FILL_BLANK)
// ---------------------------------------------------------------------------

export type CheckQuestionRequest = {
  optionKey?: string;
  answer?: string;
};

export type QuestionCheckDTO = {
  questionId: number;
  outcome: QuizOutcome;
  correct: boolean;
  correctAnswer: string;
  correctOptionKey?: string;
  /** LISTENING: the heard word's meaning, revealed only after answering. */
  meaning?: string | null;
};

// ---------------------------------------------------------------------------
// 4. Matching Pair Attempt
// ---------------------------------------------------------------------------

export type MatchingAttemptRequest = {
  leftTileKey: string;
  rightTileKey: string;
};

export type MatchingAttemptDTO = {
  quizId: number;
  roundNo: number;
  leftTileKey: string;
  rightTileKey: string;
  correct: boolean;
  attemptNo: number;
  outcome: QuizOutcome;
  resolved: boolean;
  round: {
    matchedCount: number;
    totalPairs: number;
    completed: boolean;
  };
};

// ---------------------------------------------------------------------------
// 5. Completion & Result
// ---------------------------------------------------------------------------

export type QuizResultSummary = {
  totalUnits: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number; // 0..1
};

export type QuizResultItem = {
  questionId: number;
  position: number;
  roundNo?: number | null;
  prompt: string;
  learnerAnswer?: string | null;
  correctAnswer: string;
  outcome: QuizOutcome;
  resolved: boolean;
  attemptCount: number;
  /** LISTENING: the word's meaning. */
  meaning?: string | null;
};

export type QuizResultDTO = {
  quizId: number;
  status: QuizStatus;
  mode: QuizMode;
  direction: QuizDirection | null;
  topicId: number;
  topicName: string;
  /** Null unless status is COMPLETED: a cancelled/expired quiz has no final score. */
  summary: QuizResultSummary | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  /** Backend-calculated completedAt - createdAt (D15); null unless the quiz is COMPLETED. */
  durationSeconds?: number | null;
  /** XP written by the backend on complete; `bonusAmount > 0` when an XP Booster was active. Null when 0 correct. */
  xp?: { baseAmount: number; bonusAmount: number; amount: number } | null;
  items: QuizResultItem[];
};

export type QuizResultResponse = QuizResultDTO;

export type QuizLifecycleDTO = {
  quizId: number;
  status: QuizStatus;
  cancelledAt?: string | null;
};

export type QuizLifecycleDto = QuizLifecycleDTO;

// ---------------------------------------------------------------------------
// 6. History
// ---------------------------------------------------------------------------

export type QuizHistoryItemDTO = {
  quizId: number;
  topicId: number;
  topicName: string;
  mode: QuizMode;
  direction: QuizDirection | null;
  status: QuizStatus;
  questionCount: number;
  correctCount: number | null;
  incorrectCount: number | null;
  accuracy: number | null;
  createdAt: string;
  completedAt: string | null;
};

export type QuizHistorySummaryResponse = QuizHistoryItemDTO;

// ---------------------------------------------------------------------------
// 7. Pagination
// ---------------------------------------------------------------------------

export type PaginationMeta = {
  page: number;
  size: number;
  total: number;
  pages: number;
};

export type PaginationObject<T> = {
  data: T;
  meta: PaginationMeta;
};

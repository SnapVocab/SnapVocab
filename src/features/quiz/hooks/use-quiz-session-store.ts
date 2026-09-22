import type { StateStorage } from 'zustand/middleware';
import type { QuizAnswerStatus, QuizPlayResponse } from '../types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storage } from '@/lib/storage';

export type PendingUnitRequest = {
  unitKey: string;
  action: 'CHECK' | 'SKIP';
  payload: any;
  idempotencyKey: string;
  stagedAt: number;
};

export type UnitFeedback = {
  answerStatus: QuizAnswerStatus;
  correct: boolean | null;
  feedback?: Record<string, any>;
};

export type QuizSessionStateData = {
  drafts: Record<string, any>;
  pendingRequests: Record<string, PendingUnitRequest>;
  committedFeedbacks: Record<number, UnitFeedback>;
};

type QuizSessionStore = {
  sessions: Record<string, QuizSessionStateData>;

  getSession: (sessionKey: string) => QuizSessionStateData;
  setDraft: (sessionKey: string, unitKey: string, value: any) => void;
  stagePendingRequest: (sessionKey: string, request: PendingUnitRequest) => void;
  clearPendingRequest: (sessionKey: string, unitKey: string) => void;
  commitQuestionFeedback: (sessionKey: string, questionId: number, feedback: UnitFeedback) => void;
  commitMatchingRoundFeedbacks: (
    sessionKey: string,
    roundUnitKey: string,
    pairs: { questionId: number; answerStatus: QuizAnswerStatus; correct: boolean }[],
  ) => void;
  syncWithServerPlay: (sessionKey: string, playData: QuizPlayResponse) => void;
  clearSession: (sessionKey: string) => void;
};

const mmkvStorage: StateStorage = {
  setItem: (name, value) => {
    return storage.set(name, value);
  },
  getItem: (name) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name) => {
    return storage.remove(name);
  },
};

const DEFAULT_SESSION: QuizSessionStateData = {
  drafts: {},
  pendingRequests: {},
  committedFeedbacks: {},
};

export const useQuizSessionStore = create<QuizSessionStore>()(
  persist(
    (set, get) => ({
      sessions: {},

      getSession: (sessionKey: string) => {
        return get().sessions[sessionKey] || DEFAULT_SESSION;
      },

      setDraft: (sessionKey, unitKey, value) => {
        set((state) => {
          const session = state.sessions[sessionKey] || { ...DEFAULT_SESSION };
          return {
            sessions: {
              ...state.sessions,
              [sessionKey]: {
                ...session,
                drafts: {
                  ...session.drafts,
                  [unitKey]: value,
                },
              },
            },
          };
        });
      },

      stagePendingRequest: (sessionKey, request) => {
        set((state) => {
          const session = state.sessions[sessionKey] || { ...DEFAULT_SESSION };
          return {
            sessions: {
              ...state.sessions,
              [sessionKey]: {
                ...session,
                pendingRequests: {
                  ...session.pendingRequests,
                  [request.unitKey]: request,
                },
              },
            },
          };
        });
      },

      clearPendingRequest: (sessionKey, unitKey) => {
        set((state) => {
          const session = state.sessions[sessionKey];
          if (!session)
            return state;
          const { [unitKey]: _, ...remainingPending } = session.pendingRequests;
          return {
            sessions: {
              ...state.sessions,
              [sessionKey]: {
                ...session,
                pendingRequests: remainingPending,
              },
            },
          };
        });
      },

      commitQuestionFeedback: (sessionKey, questionId, feedback) => {
        set((state) => {
          const session = state.sessions[sessionKey] || { ...DEFAULT_SESSION };
          const unitKey = `q_${questionId}`;
          const { [unitKey]: _, ...remainingPending } = session.pendingRequests;
          return {
            sessions: {
              ...state.sessions,
              [sessionKey]: {
                ...session,
                pendingRequests: remainingPending,
                committedFeedbacks: {
                  ...session.committedFeedbacks,
                  [questionId]: feedback,
                },
              },
            },
          };
        });
      },

      commitMatchingRoundFeedbacks: (sessionKey, roundUnitKey, pairs) => {
        set((state) => {
          const session = state.sessions[sessionKey] || { ...DEFAULT_SESSION };
          const { [roundUnitKey]: _, ...remainingPending } = session.pendingRequests;
          const newFeedbacks = { ...session.committedFeedbacks };
          for (const p of pairs) {
            newFeedbacks[p.questionId] = {
              answerStatus: p.answerStatus,
              correct: p.correct,
            };
          }
          return {
            sessions: {
              ...state.sessions,
              [sessionKey]: {
                ...session,
                pendingRequests: remainingPending,
                committedFeedbacks: newFeedbacks,
              },
            },
          };
        });
      },

      syncWithServerPlay: (sessionKey, playData) => {
        set((state) => {
          const session = state.sessions[sessionKey] || { ...DEFAULT_SESSION };
          const updatedFeedbacks = { ...session.committedFeedbacks };
          const remainingPending = { ...session.pendingRequests };

          for (const q of playData.questions) {
            if (q.feedback && q.feedback.answerStatus !== 'UNCOMMITTED') {
              updatedFeedbacks[q.id] = {
                answerStatus: q.feedback.answerStatus as QuizAnswerStatus,
                correct: q.feedback.correct,
              };
              delete remainingPending[`q_${q.id}`];
              if (q.roundNo) {
                delete remainingPending[`round_${q.roundNo}`];
              }
            }
          }

          return {
            sessions: {
              ...state.sessions,
              [sessionKey]: {
                ...session,
                pendingRequests: remainingPending,
                committedFeedbacks: updatedFeedbacks,
              },
            },
          };
        });
      },

      clearSession: (sessionKey) => {
        set((state) => {
          const { [sessionKey]: _, ...rest } = state.sessions;
          return { sessions: rest };
        });
      },
    }),
    {
      name: 'quiz-session-storage',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);

import type { StateStorage } from 'zustand/middleware';
import type { ApiResponse } from '../auth/api';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { client } from '@/lib/api';
import { storage } from '@/lib/storage';

/**
 * Where "Save" puts a word (buss_mainflow.md BF-07 step 2): the last topic the learner saved to,
 * else their default topic, and "Đổi" picks another.
 */
export type SaveDestination = {
  collectionId: number;
  collectionName: string;
  topicId: number;
  topicName: string;
  activeTemplateId?: number | null;
};

type DefaultTopicDTO = {
  collectionId: number;
  collectionName: string;
  collectionTranslation: string | null;
  topicId: number;
  topicName: string;
  topicTranslation: string | null;
  activeTemplateId: number | null;
};

const mmkvStorage: StateStorage = {
  setItem: (name, value) => storage.set(name, value),
  getItem: name => storage.getString(name) ?? null,
  removeItem: name => storage.remove(name),
};

type State = {
  /** Keyed by user id: a shared phone must not save into the previous account's topic. */
  byUser: Record<string, SaveDestination>;
  set: (userId: number, destination: SaveDestination) => void;
  forget: (userId: number) => void;
};

const useStore = create<State>()(
  persist(
    set => ({
      byUser: {},
      set: (userId, destination) => set(state => ({ byUser: { ...state.byUser, [userId]: destination } })),
      forget: userId => set((state) => {
        const { [userId]: _gone, ...rest } = state.byUser;
        return { byUser: rest };
      }),
    }),
    { name: 'save-destination-v1', storage: createJSONStorage(() => mmkvStorage) },
  ),
);

/** The learner's remembered destination, or null when they have none yet (the default topic is then used). */
export function useSaveDestination(): SaveDestination | null {
  const userId = useAuthStore(s => s.user?.id);
  return useStore(s => (userId === undefined ? null : s.byUser[userId] ?? null));
}

export function rememberSaveDestination(destination: SaveDestination) {
  const userId = useAuthStore.getState().user?.id;
  if (userId !== undefined)
    useStore.getState().set(userId, destination);
}

/**
 * Words saved through the add-word form during this app session (not persisted), so a scan result the learner
 * returns to can show "Đã lưu" on the card they filled in by hand.
 */
export const useSavedThroughForm = create<{ words: string[]; add: (word: string) => void }>()(set => ({
  words: [],
  add: word => set(state => ({ words: [...state.words, word.trim().toLowerCase()] })),
}));

/** The remembered topic is gone (deleted, or no longer the learner's): the next save falls back to the default. */
export function forgetSaveDestination() {
  const userId = useAuthStore.getState().user?.id;
  if (userId !== undefined)
    useStore.getState().forget(userId);
}

/** A save into the remembered topic failed because that topic no longer exists or is not the learner's any more. */
export function isDestinationGone(error: unknown): boolean {
  const status = (error as { response?: { status?: number } } | undefined)?.response?.status;
  return status === 404 || status === 403;
}

/** POST /api/topics/default: get-or-create, so calling it again returns the same topic. */
export async function fetchDefaultTopic(): Promise<SaveDestination> {
  const response = await client<ApiResponse<DefaultTopicDTO>>({ url: '/api/topics/default', method: 'POST' });
  const data = response.data.data;
  return {
    collectionId: data.collectionId,
    // The names the library shows as titles, so the learner finds the same words there.
    collectionName: data.collectionName,
    topicId: data.topicId,
    topicName: data.topicName,
    activeTemplateId: data.activeTemplateId,
  };
}

/** The remembered destination, else the default topic (created now if needed and then remembered). */
export async function resolveSaveDestination(current: SaveDestination | null): Promise<SaveDestination> {
  if (current)
    return current;
  const fallback = await fetchDefaultTopic();
  rememberSaveDestination(fallback);
  return fallback;
}

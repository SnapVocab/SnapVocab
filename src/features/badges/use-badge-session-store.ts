import { create } from 'zustand';

export type UnlockIntensity = 'normal' | 'reduced';

type BadgeSessionState = {
  /** Ids already presented this app session (modal or Achievements NEW state); never presented again until restart. */
  shownIds: number[];
  /** Ids whose `/seen` failed; retried after the next successful sync (badges.md §9). */
  pendingSeenIds: number[];
  /** Explicit request to open the unlock modal now, e.g. from the Quiz Result row, bypassing the route denylist. */
  request: { ids: number[]; intensity: UnlockIntensity } | null;
  markShown: (ids: number[]) => void;
  addPendingSeen: (ids: number[]) => void;
  clearPendingSeen: (ids: number[]) => void;
  requestUnlock: (ids: number[], intensity: UnlockIntensity) => void;
  clearRequest: () => void;
};

const union = (a: number[], b: number[]) => [...new Set([...a, ...b])];

/** In-memory only: a restart forgets it, so an unseen badge whose `/seen` never succeeded is shown once more. */
export const useBadgeSessionStore = create<BadgeSessionState>(set => ({
  shownIds: [],
  pendingSeenIds: [],
  request: null,
  markShown: ids => set(s => ({ shownIds: union(s.shownIds, ids) })),
  addPendingSeen: ids => set(s => ({ pendingSeenIds: union(s.pendingSeenIds, ids) })),
  clearPendingSeen: ids => set(s => ({ pendingSeenIds: s.pendingSeenIds.filter(id => !ids.includes(id)) })),
  requestUnlock: (ids, intensity) => set(s => ({ request: { ids, intensity }, shownIds: union(s.shownIds, ids) })),
  clearRequest: () => set({ request: null }),
}));

import type { ScanItem } from './api';
import { create } from 'zustand';
import { createSelectors } from '@/lib/utils';

export type ScanPhoto = {
  uri: string;
  width: number;
  height: number;
};

type ScanState = {
  photo: ScanPhoto | null;
  results: ScanItem[];
  setScan: (photo: ScanPhoto, results: ScanItem[]) => void;
  reset: () => void;
};

// Ephemeral, in-memory only (no MMKV persistence) — results carry base64 image
// blobs that are only relevant for the lifetime of a single scan session.
// `photo` (the original captured/picked image + its pixel dimensions) is kept
// alongside so the results screen can draw detection boxes at the right scale.
const store = create<ScanState>()(set => ({
  photo: null,
  results: [],

  setScan: (photo, results) => set({ photo, results }),
  reset: () => set({ photo: null, results: [] }),
}));

export const useScanStore = createSelectors(store);

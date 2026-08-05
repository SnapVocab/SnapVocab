import type { ScanResult } from './api';
import { create } from 'zustand';
import { createSelectors } from '@/lib/utils';

type ScanState = {
  result: ScanResult | null;
  setResult: (result: ScanResult) => void;
  reset: () => void;
};

// Ephemeral, in-memory only (no MMKV persistence) — the result carries a base64
// image that is only relevant for the lifetime of a single scan session.
const store = create<ScanState>()(set => ({
  result: null,

  setResult: result => set({ result }),
  reset: () => set({ result: null }),
}));

export const useScanStore = createSelectors(store);

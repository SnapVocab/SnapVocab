import type { AxiosError } from 'axios';
import type { ApiResponse } from '@/features/auth/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/api';

/** "Quên" this many times makes a word a leech that may get an AI mnemonic (mirrors the backend). */
export const MIN_FORGET_COUNT = 2;

export type MnemonicType = 'SOUND_ALIKE' | 'WORDPLAY' | 'STORY';
/** The learner's own AI mnemonic for one card (never shared with other learners). */
export type Mnemonic = {
  topicItemId: number;
  type: MnemonicType;
  keyword: string | null;
  content: string;
  updatedAt: string;
};
export type MnemonicResult = { mnemonic: Mnemonic; dailyLimit: number; remainingToday: number };
/** "Từ hay quên" row; `mnemonic` is null until one is made. */
export type LeechWord = {
  topicItemId: number;
  word: string;
  meaning: string | null;
  forgetCount: number;
  mnemonic: Mnemonic | null;
};
/** `total` counts every leech; `items` holds the first `limit` (absent on an older backend). */
export type LeechList = {
  items: LeechWord[];
  total?: number;
  minForgetCount: number;
  dailyLimit: number;
  remainingToday: number;
};

/** The stats card shows a few; "Xem tất cả" asks for the backend's maximum. */
export const LEECH_PREVIEW_LIMIT = 20;
export const LEECH_ALL_LIMIT = 200;

type MnemonicError = AxiosError<ApiResponse<unknown>>;

// Outside ['study']: invalidating the study keys would refetch a running session's queue.
export const leechesKey = ['mnemonics', 'leeches'] as const;

export function useLeeches(limit: number = LEECH_PREVIEW_LIMIT) {
  return useQuery<LeechList, MnemonicError>({
    queryKey: [...leechesKey, limit],
    queryFn: async () =>
      (await client<ApiResponse<LeechList>>({ url: '/api/study/leeches', method: 'GET', params: { limit } })).data.data,
    staleTime: 60 * 1000,
  });
}

/** Creates the mnemonic, or replaces it ("Tạo lại"). */
export function useGenerateMnemonic() {
  const queryClient = useQueryClient();
  return useMutation<MnemonicResult, MnemonicError, number>({
    mutationFn: async topicItemId =>
      (
        await client<ApiResponse<MnemonicResult>>({
          url: `/api/study/items/${topicItemId}/mnemonic`,
          method: 'POST',
        })
      ).data.data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leechesKey }),
  });
}

export function useDeleteMnemonic() {
  const queryClient = useQueryClient();
  return useMutation<void, MnemonicError, number>({
    mutationFn: async (topicItemId) => {
      await client({ url: `/api/study/items/${topicItemId}/mnemonic`, method: 'DELETE' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leechesKey }),
  });
}

/** The message key for a failed generation; the server says why in `error`. */
export function mnemonicErrorKey(error: MnemonicError | null | undefined) {
  switch (error?.response?.data?.error) {
    case 'MNEMONIC_QUOTA_EXCEEDED': return 'mnemonic.error_quota' as const;
    case 'AI_UNAVAILABLE': return 'mnemonic.error_ai' as const;
    case 'NOT_A_LEECH': return 'mnemonic.error_not_leech' as const;
    default: return 'mnemonic.error_generic' as const;
  }
}

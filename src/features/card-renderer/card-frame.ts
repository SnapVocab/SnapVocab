import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { meKey } from '@/features/profile/api';

/**
 * Card frame contract (plan/shop-item/card_frame_plan.md §3): every frame is a 3:4 asset with the same content
 * window, relative to the frame, origin top-left. Mirrors AdminShopService.CARD_FRAME_CONTRACT; change both together.
 */
export const CARD_FRAME_ASPECT = 3 / 4;
export const CARD_FRAME_WINDOW = { x: 0.09, y: 0.09, width: 0.82, height: 0.82 };
/** Window corner radius of the template, as a share of the frame width (36 px on 1080). */
export const CARD_FRAME_WINDOW_RADIUS = 36 / 1080;

/** Largest 3:4 card inside `width` × `maxHeight` (width-bound when there is no height limit). */
export function cardFrameSize(width: number, maxHeight?: number) {
  const w = maxHeight ? Math.min(width, maxHeight * CARD_FRAME_ASPECT) : width;
  return { width: w, height: w / CARD_FRAME_ASPECT };
}

// ponytail: one refetch per frame URL per app run, so a broken asset never loops requests (AC-CF-06).
const refetchedUrls = new Set<string>();

/** The equipped card frame from GET /api/users/me; on a load error, fetch a fresh (re-signed) URL once. */
export function useEquippedCardFrame() {
  return useEquippedFrame('cardFrameUrl');
}

/** Same contract for the avatar slot. */
export function useEquippedAvatarFrame() {
  return useEquippedFrame('avatarFrameUrl');
}

function useEquippedFrame(slot: 'avatarFrameUrl' | 'cardFrameUrl') {
  const frameUrl = useAuthStore(s => s.user?.equipped?.[slot] ?? null);
  const queryClient = useQueryClient();
  const onFrameError = useCallback(() => {
    if (!frameUrl || refetchedUrls.has(frameUrl))
      return;
    refetchedUrls.add(frameUrl);
    void queryClient.invalidateQueries({ queryKey: meKey });
  }, [frameUrl, queryClient]);
  return { frameUrl, onFrameError };
}

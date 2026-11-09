/**
 * The AI service shrinks every photo so its long edge is at most this many
 * pixels (MAX_INPUT_SIZE) before detection, so anything larger is only upload time.
 */
export const AI_INPUT_LONG_EDGE = 1400;

const FOUR_BY_THREE = 4 / 3;

/**
 * Picks the smallest 4:3 camera size that still covers what the AI will use.
 * Full-sensor shots are ~2.4MB, which took about a minute to reach the AI;
 * a 1600x1200 shot is a fraction of that and gives the AI the same pixels.
 * Returns undefined (keep the camera default) when no size qualifies.
 */
export function pickScanPictureSize(
  sizes: string[],
  minLongEdge = AI_INPUT_LONG_EDGE,
): string | undefined {
  let best: { size: string; longEdge: number } | undefined;
  for (const size of sizes) {
    const match = /^(\d+)x(\d+)$/.exec(size);
    if (!match)
      continue;
    const longEdge = Math.max(Number(match[1]), Number(match[2]));
    const shortEdge = Math.min(Number(match[1]), Number(match[2]));
    const isFourByThree = shortEdge > 0 && Math.abs(longEdge / shortEdge - FOUR_BY_THREE) <= 0.02;
    if (!isFourByThree || longEdge < minLongEdge)
      continue;
    if (!best || longEdge < best.longEdge)
      best = { size, longEdge };
  }
  return best?.size;
}

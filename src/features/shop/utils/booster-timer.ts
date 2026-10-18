/**
 * Computes estimated server-synchronized time and remaining countdown
 * based on serverNow and deviceNowAtResponse to handle clock skew accurately.
 */

export type ServerOffsetState = {
  serverNowIso: string;
  deviceNowMs: number;
};

/**
 * Calculates server offset: serverTime - deviceTime.
 */
export function calculateServerOffset(serverNowIso: string, deviceNowMs: number = Date.now()): number {
  const serverTime = new Date(serverNowIso).getTime();
  if (Number.isNaN(serverTime)) {
    return 0;
  }
  return serverTime - deviceNowMs;
}

/**
 * Estimates the current server timestamp using the known server offset.
 */
export function getEstimatedServerTime(serverOffsetMs: number): number {
  return Date.now() + serverOffsetMs;
}

/**
 * Returns remaining milliseconds until expiration, or 0 if expired.
 */
export function getRemainingBoosterMs(expiresAtIso: string, serverOffsetMs: number): number {
  const expiresAt = new Date(expiresAtIso).getTime();
  if (Number.isNaN(expiresAt)) {
    return 0;
  }
  const estimatedServerNow = getEstimatedServerTime(serverOffsetMs);
  return Math.max(0, expiresAt - estimatedServerNow);
}

/** A cached activation is only "active" until its server-time expiry; the object alone may be stale. */
export function isBoosterLive(active: { expiresAt: string } | null | undefined, serverOffsetMs: number): boolean {
  return Boolean(active) && getRemainingBoosterMs(active!.expiresAt, serverOffsetMs) > 0;
}

/**
 * Formats milliseconds remaining into MM:SS or HH:MM:SS display string.
 */
export function formatRemainingTime(remainingMs: number): string {
  if (remainingMs <= 0) {
    return '00:00';
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

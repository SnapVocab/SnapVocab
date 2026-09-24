import * as Crypto from 'expo-crypto';

/**
 * Generates a unique, compliant UUID v4 string for the Idempotency-Key header.
 * Uses expo-crypto on native/web and falls back to global crypto in test environments.
 */
export function generateIdempotencyKey(): string {
  try {
    if (typeof Crypto?.randomUUID === 'function') {
      const uuid = Crypto.randomUUID();
      if (uuid) {
        return uuid;
      }
    }
  }
  catch {
    // Continue to fallbacks
  }

  if (typeof globalThis?.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  // Fallback RFC4122 v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

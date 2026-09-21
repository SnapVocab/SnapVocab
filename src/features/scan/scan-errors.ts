import type { ScanErrorCode } from './types';
import { isAxiosError } from 'axios';

const SERVER_CODES: readonly ScanErrorCode[] = [
  'INVALID_IMAGE',
  'QUOTA_EXCEEDED',
  'AI_QUEUE_FULL',
  'AI_UNAVAILABLE',
  'AI_TIMEOUT',
  'AI_ERROR',
  'INTERRUPTED',
];

/** Server codes plus the failures that happen on the device before the server is reached. */
export type ScanFailure
  = | ScanErrorCode
    | 'UNSUPPORTED_FORMAT'
    | 'UPLOAD_FAILED'
    | 'NETWORK'
    | 'UNKNOWN';

/** Thrown by the upload step so the UI can tell it apart from API errors. */
export class ScanClientError extends Error {
  constructor(public readonly failure: ScanFailure, message?: string) {
    super(message ?? failure);
    this.name = 'ScanClientError';
  }
}

export function isServerCode(value: unknown): value is ScanErrorCode {
  return typeof value === 'string' && (SERVER_CODES as readonly string[]).includes(value);
}

/**
 * Maps anything a scan call can throw to one failure. The backend puts scan
 * codes in `RestResponse.error` (e.g. `{ statusCode: 429, error: "QUOTA_EXCEEDED" }`).
 */
export function toScanFailure(error: unknown): ScanFailure {
  if (error instanceof ScanClientError)
    return error.failure;

  if (isAxiosError(error)) {
    if (!error.response)
      return 'NETWORK';
    const code = (error.response.data as { error?: unknown } | undefined)?.error;
    return isServerCode(code) ? code : 'UNKNOWN';
  }

  return 'UNKNOWN';
}

const MESSAGE_KEYS = {
  INVALID_IMAGE: 'scan.errors.invalid_image',
  QUOTA_EXCEEDED: 'scan.errors.quota_exceeded',
  AI_QUEUE_FULL: 'scan.errors.queue_full',
  AI_UNAVAILABLE: 'scan.errors.ai_unavailable',
  AI_TIMEOUT: 'scan.errors.ai_timeout',
  AI_ERROR: 'scan.errors.ai_error',
  INTERRUPTED: 'scan.errors.interrupted',
  UNSUPPORTED_FORMAT: 'scan.errors.unsupported_format',
  UPLOAD_FAILED: 'scan.errors.upload_failed',
  NETWORK: 'scan.errors.network',
  UNKNOWN: 'scan.errors.unknown',
} as const satisfies Record<ScanFailure, string>;

export function scanFailureMessageKey(failure: ScanFailure) {
  return MESSAGE_KEYS[failure];
}

/** Failures worth a plain "try again": transient, and they did not cost a scan. */
export function isRetryable(failure: ScanFailure): boolean {
  return failure !== 'QUOTA_EXCEEDED'
    && failure !== 'INVALID_IMAGE'
    && failure !== 'UNSUPPORTED_FORMAT';
}

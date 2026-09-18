import { AxiosError, AxiosHeaders } from 'axios';
import { isRetryable, ScanClientError, scanFailureMessageKey, toScanFailure } from './scan-errors';

function axiosError(status?: number, data?: unknown) {
  const config = { headers: new AxiosHeaders() };
  const response = status === undefined
    ? undefined
    : { status, statusText: '', headers: {}, config, data };
  return new AxiosError('failed', 'ERR', config, undefined, response);
}

describe('toScanFailure', () => {
  it('reads the scan code the backend puts in RestResponse.error', () => {
    expect(toScanFailure(axiosError(429, { statusCode: 429, error: 'QUOTA_EXCEEDED' }))).toBe('QUOTA_EXCEEDED');
    expect(toScanFailure(axiosError(503, { error: 'AI_QUEUE_FULL' }))).toBe('AI_QUEUE_FULL');
  });

  it('treats a missing response as a network failure', () => {
    expect(toScanFailure(axiosError())).toBe('NETWORK');
  });

  it('does not mistake other errors (e.g. validation) for scan codes', () => {
    expect(toScanFailure(axiosError(400, { error: 'Validation failed' }))).toBe('UNKNOWN');
  });

  it('passes through client-side failures', () => {
    expect(toScanFailure(new ScanClientError('UPLOAD_FAILED'))).toBe('UPLOAD_FAILED');
    expect(toScanFailure(new Error('boom'))).toBe('UNKNOWN');
  });
});

describe('failure helpers', () => {
  it('maps every failure to a message key', () => {
    expect(scanFailureMessageKey('AI_TIMEOUT')).toBe('scan.errors.ai_timeout');
    expect(scanFailureMessageKey('UNSUPPORTED_FORMAT')).toBe('scan.errors.unsupported_format');
  });

  it('only offers retry when retrying can help', () => {
    expect(isRetryable('AI_TIMEOUT')).toBe(true);
    expect(isRetryable('INTERRUPTED')).toBe(true);
    expect(isRetryable('QUOTA_EXCEEDED')).toBe(false);
    expect(isRetryable('INVALID_IMAGE')).toBe(false);
  });
});

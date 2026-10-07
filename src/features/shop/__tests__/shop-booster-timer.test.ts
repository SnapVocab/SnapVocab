import {
  calculateServerOffset,
  formatRemainingTime,
  getEstimatedServerTime,
  getRemainingBoosterMs,
} from '../utils/booster-timer';

describe('booster countdown with server clock skew compensation', () => {
  it('calculates server offset accurately', () => {
    const serverNow = '2026-09-25T08:00:00.000Z';
    // Device is 5 seconds behind server
    const deviceTime = new Date('2026-09-25T07:59:55.000Z').getTime();

    const offset = calculateServerOffset(serverNow, deviceTime);
    expect(offset).toBe(5000);
  });

  it('calculates negative offset when device is ahead of server', () => {
    const serverNow = '2026-09-25T08:00:00.000Z';
    // Device is 10 seconds ahead of server
    const deviceTime = new Date('2026-09-25T08:00:10.000Z').getTime();

    const offset = calculateServerOffset(serverNow, deviceTime);
    expect(offset).toBe(-10000);
  });

  it('computes remaining milliseconds accounting for server offset', () => {
    const expiresAt = '2026-09-25T08:30:00.000Z';
    // Server says it is 08:00:00, but device clock says 08:05:00 (offset = -300000)
    const serverOffsetMs = -300000;

    // Suppose Date.now() on device returns 08:05:00
    const originalNow = Date.now;
    Date.now = jest.fn(() => new Date('2026-09-25T08:05:00.000Z').getTime());

    const remaining = getRemainingBoosterMs(expiresAt, serverOffsetMs);
    // Estimated server time = 08:05:00 - 5min = 08:00:00
    // Remaining = 30 minutes = 1,800,000 ms
    expect(remaining).toBe(1800000);

    Date.now = originalNow;
  });

  it('returns 0 remaining milliseconds when past expiration', () => {
    const expiresAt = '2026-09-25T08:00:00.000Z';
    const serverOffsetMs = 0;

    const originalNow = Date.now;
    Date.now = jest.fn(() => new Date('2026-09-25T08:00:01.000Z').getTime());

    const remaining = getRemainingBoosterMs(expiresAt, serverOffsetMs);
    expect(remaining).toBe(0);

    Date.now = originalNow;
  });

  it('formats remaining milliseconds into MM:SS correctly', () => {
    // 30 minutes
    expect(formatRemainingTime(30 * 60 * 1000)).toBe('30:00');
    // 14 minutes 45 seconds
    expect(formatRemainingTime((14 * 60 + 45) * 1000)).toBe('14:45');
    // 5 seconds
    expect(formatRemainingTime(5000)).toBe('00:05');
    // 0 milliseconds
    expect(formatRemainingTime(0)).toBe('00:00');
    // Negative milliseconds
    expect(formatRemainingTime(-500)).toBe('00:00');
    // More than 1 hour (1 hr 15 mins 20 secs)
    expect(formatRemainingTime((75 * 60 + 20) * 1000)).toBe('1:15:20');
  });
});

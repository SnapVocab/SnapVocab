import { formatDate, formatTimeOfDay, fullName, initials, reminderOptions } from './display';

describe('fullName', () => {
  it('joins the parts that exist', () => {
    expect(fullName({ firstName: 'Trọng', lastName: 'Hoàng' })).toBe('Trọng Hoàng');
    expect(fullName({ firstName: 'Trọng', lastName: '' })).toBe('Trọng');
    expect(fullName(null)).toBe('');
  });
});

describe('initials', () => {
  it('takes the first and last word', () => {
    expect(initials('Hoàng Minh Trọng')).toBe('HT');
    expect(initials('Trọng')).toBe('T');
  });

  it('falls back when there is no name', () => {
    expect(initials('   ')).toBe('?');
  });
});

describe('formatDate', () => {
  it('formats an ISO instant as dd/MM/yyyy', () => {
    expect(formatDate('2026-09-18T05:44:49Z')).toMatch(/^\d{2}\/09\/2026$/);
  });

  it('stays empty for missing or broken values', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate('not a date')).toBe('');
  });
});

describe('formatTimeOfDay', () => {
  it('drops the seconds the backend sends', () => {
    expect(formatTimeOfDay('20:30:00')).toBe('20:30');
    expect(formatTimeOfDay('07:05')).toBe('07:05');
  });

  it('returns null when the reminder is off', () => {
    expect(formatTimeOfDay(null)).toBeNull();
    expect(formatTimeOfDay('')).toBeNull();
  });
});

describe('reminderOptions', () => {
  it('covers the day in half hours', () => {
    const options = reminderOptions();
    expect(options).toHaveLength(48);
    expect(options[0]).toBe('00:00');
    expect(options[13]).toBe('06:30');
    expect(options.at(-1)).toBe('23:30');
  });
});

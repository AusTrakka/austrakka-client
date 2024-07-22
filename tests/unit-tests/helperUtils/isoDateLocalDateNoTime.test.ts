import { register, TimeZone, unregister } from 'timezone-mock';
import { isoDateLocalDateNoTime } from '../../../src/utilities/helperUtils';
import { formatTestDate, parseTestDate } from '../../test-utils/dateTestUtils';

describe('isoDateLocalDateNoTime', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-07-22T02:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test('returns correct local date for UTC input', () => {
    const date = new Date();
    const result = isoDateLocalDateNoTime(date.toISOString());
    const expected = formatTestDate(date);
    expect(result).toEqual(expected);

    const parsedResult = parseTestDate(result);
    expect(parsedResult.getUTCMonth()).toEqual(date.getUTCMonth()); // July is 6 (zero-indexed)
    expect(parsedResult.getUTCDate()).toEqual(date.getUTCDate());
    expect(result).toMatch(expected);
  });

  test('handles different date input correctly', () => {
    const differentDate = new Date('2024-07-19T15:30:00Z');
    const result = isoDateLocalDateNoTime(differentDate.toISOString());
    const parsedResult = parseTestDate(result);
    // Use getUTCx for what is in the string without converting to local timezone
    // Use getX for getting the date info but converted to local time
    expect(parsedResult.getUTCFullYear()).toEqual(differentDate.getFullYear());
    // July is 6 (zero-indexed)
    expect(parsedResult.getUTCMonth()).toEqual(differentDate.getMonth());
    expect(parsedResult.getUTCDate()).toEqual(differentDate.getDate());
  });

  test('returns empty string for empty input', () => {
    expect(isoDateLocalDateNoTime('')).toEqual('');
  });

  test('returns empty string when null is given', () => {
    expect(isoDateLocalDateNoTime('null')).toEqual('');
  });

  test('handles invalid input', () => {
    const result = isoDateLocalDateNoTime('not a date');
    expect(result).toBe('Invalid Date');
  });

  test('handles dates near Daylight Saving Time changes', () => {
    const beforeDST = new Date('2024-03-31T00:30:00Z');
    const afterDST = new Date('2024-03-31T03:30:00Z');

    const resultBefore = isoDateLocalDateNoTime(beforeDST.toISOString());
    const resultAfter = isoDateLocalDateNoTime(afterDST.toISOString());

    const parsedBefore = parseTestDate(resultBefore);
    const parsedAfter = parseTestDate(resultAfter);

    expect(parsedAfter.getTime() - parsedBefore.getTime()).toBe(0); // Should be the same day
  });

  test('handles different UTC date formats', () => {
    const formats = [
      new Date().toISOString(),
      new Date().toISOString().replace('Z', '+00:00'),
      new Date().toISOString().replace('.000Z', 'Z'),
      new Date().toISOString().replace('T', ' '),
    ];
    const results = formats.map(f => isoDateLocalDateNoTime(f));

    results.forEach((result, index) => {
      if (index >= 0) {
        expect(result).toEqual(results[0]);
      }
    });
  });

  test('handles extreme dates', () => {
    const extremeDates = [
      new Date('1900-01-01T00:00:00Z'),
      new Date('2100-12-31T23:59:59Z'),
    ];

    extremeDates.forEach(date => {
      const result = isoDateLocalDateNoTime(date.toISOString());
      expect(result).not.toEqual('Invalid Date');
      const parsed = parseTestDate(result);
      expect(parsed.getTime()).not.toBeNaN();
    });
  });

  test('does not preserve time', () => {
    const input = new Date().toISOString().replace('.000Z', '.123Z');
    const result = isoDateLocalDateNoTime(input);
    const parsed = parseTestDate(result);
    expect(parsed.getUTCHours()).toBe(0);
    expect(parsed.getUTCMinutes()).toBe(0);
    expect(parsed.getUTCSeconds()).toBe(0);
    expect(parsed.getUTCMilliseconds()).toBe(0);
  });

  test('consistent across time zone parsing even without time', () => {
    const input = new Date();
    const mockTimezones: TimeZone[] = ['Australia/Adelaide', 'US/Eastern', 'Europe/London', 'US/Pacific', 'Etc/GMT+9', 'Etc/GMT-9', 'UTC'];

    const results = mockTimezones.map(zone => {
      register(zone);
      const result = isoDateLocalDateNoTime(input.toISOString());
      const expected = formatTestDate(input, zone);
      unregister();
      return { zone, result, expected };
    });

    // All results should be the same, regardless of timezone
    results.forEach(item => {
      expect(item.result).toMatch(item.expected);
    });
  });
});

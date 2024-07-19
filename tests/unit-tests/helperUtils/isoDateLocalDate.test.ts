import { describe, test, expect } from '@jest/globals';
import { TimeZone, register, unregister } from 'timezone-mock';
import { isoDateLocalDate } from '../../../src/utilities/helperUtils';
import { formatTestDate, parseTestDate } from '../../test-utils/dateTestUtils';

describe('isoDateLocalDate', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-07-18T12:00:00Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test('returns correct local time for UTC input', () => {
    const utcTimeStamp = '2024-07-18T12:00:00Z';
    const result = isoDateLocalDate(utcTimeStamp);

    const expectedDate = new Date('2024-07-18T12:00:00Z');
    const expected = formatTestDate(expectedDate);

    expect(result).toEqual(expected);

    const parsedResult = parseTestDate(result);
    expect(parsedResult.getHours()).toEqual(expectedDate.getHours());
    expect(parsedResult.getMinutes()).toEqual(expectedDate.getMinutes());
  });

  test('handles different time input correctly', () => {
    const utcTimeStamp = '2024-07-18T15:30:00Z';
    const result = isoDateLocalDate(utcTimeStamp);

    // Parse the result
    const parsedResult = parseTestDate(result);

    // Create a Date object from the original UTC timestamp
    const originalDate = new Date(utcTimeStamp);

    // Compare the time components
    expect(parsedResult.getFullYear()).toEqual(originalDate.getFullYear());
    expect(parsedResult.getMonth()).toEqual(originalDate.getMonth());
    expect(parsedResult.getDate()).toEqual(originalDate.getDate());

    // Check if the time difference is a whole number of hours
    const timeDiff = parsedResult.getTime() - originalDate.getTime();
    expect(timeDiff % (60 * 60 * 1000)).toBe(0);

    // Check if minutes are preserved
    expect(parsedResult.getMinutes()).toEqual(originalDate.getUTCMinutes());
  });

  test('returns empty string for empty input', () => {
    expect(isoDateLocalDate('')).toEqual('');
  });

  test('returns null when null is given', () => {
    expect(isoDateLocalDate('null')).toEqual('');
  });

  test('handles dates near Daylight Saving Time changes', () => {
    // Assuming DST change occurs on March 31, 2024 at 2:00 AM in many time zones
    const beforeDST = '2024-03-31T00:30:00Z';
    const afterDST = '2024-03-31T03:30:00Z';

    const resultBefore = isoDateLocalDate(beforeDST);
    const resultAfter = isoDateLocalDate(afterDST);

    const parsedBefore = parseTestDate(resultBefore);
    const parsedAfter = parseTestDate(resultAfter);

    expect(parsedAfter.getTime() - parsedBefore.getTime()).toBe(3 * 60 * 60 * 1000);
  });

  test('handles different UTC date formats', () => {
    const formats = [
      '2024-07-18T15:30:00Z',
      '2024-07-18T15:30:00+00:00',
      '2024-07-18T15:30:00.000Z',
      '2024-07-18 15:30:00Z',
    ];

    const results = formats.map(isoDateLocalDate);

    results.forEach((result, index) => {
      if (index > 0) {
        expect(result).toEqual(results[0]);
      }
    });
  });

  test('handles extreme dates', () => {
    const extremeDates = [
      '1900-01-01T00:00:00Z',
      '2100-12-31T23:59:59Z',
    ];

    extremeDates.forEach(date => {
      const result = isoDateLocalDate(date);
      expect(result).not.toEqual('Invalid Date');
      const parsed = parseTestDate(result);
      expect(parsed.getTime()).not.toBeNaN();
    });
  });

  test('Does not preserve milliseconds', () => {
    const input = '2024-07-18T15:30:00.123Z';
    const result = isoDateLocalDate(input);
    const parsed = parseTestDate(result);
    expect(parsed.getMilliseconds()).not.toBe(123);
  });

  test('consistent across time zones', () => {
    const input = '2024-07-18T15:30:00Z';
    const mockTimezones: TimeZone[] = ['Australia/Adelaide', 'US/Eastern', 'Europe/London'];

    const results = mockTimezones.map((zone: TimeZone) => {
      register(zone);
      const result = isoDateLocalDate(input);
      unregister();
      return result;
    });

    // Hours should be different
    const hours = results.map(r => parseTestDate(r).getHours());
    expect(new Set(hours).size).toBeGreaterThan(1);

    // Check specific timezone conversions
    register('US/Pacific');
    expect(isoDateLocalDate(input)).toMatch(/2024-07-18 08:30/);
    unregister();

    register('Europe/London');
    expect(isoDateLocalDate(input)).toMatch(/2024-07-18 16:30/);
    unregister();
  });
});

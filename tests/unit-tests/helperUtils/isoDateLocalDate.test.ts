import { describe, test, expect } from '@jest/globals';
import { TimeZone, register, unregister } from 'timezone-mock';
import { isoDateLocalDate } from '../../../src/utilities/helperUtils';
import { formatTestDateTime, parseTestDateTime } from '../../test-utils/dateTestUtils';

describe('isoDateLocalDate', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-07-22T02:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('when given a valid UTC timestamp', () => {
    test('converts to correct local time', () => {
      const utcTimeStamp = new Date().toISOString();
      const result = isoDateLocalDate(utcTimeStamp);

      const expectedDate = new Date();
      const expected = formatTestDateTime(expectedDate);

      expect(result).toEqual(expected);

      const parsedResult = parseTestDateTime(result);
      expect(parsedResult.getHours()).toEqual(expectedDate.getHours());
      expect(parsedResult.getMinutes()).toEqual(expectedDate.getMinutes());
    });

    test('preserves date components and adjusts hours correctly', () => {
      const utcTimeStamp = new Date().toISOString();
      const result = isoDateLocalDate(utcTimeStamp);

      const parsedResult = parseTestDateTime(result);
      const originalDate = new Date(utcTimeStamp);

      expect(parsedResult.getFullYear()).toEqual(originalDate.getFullYear());
      expect(parsedResult.getMonth()).toEqual(originalDate.getMonth());
      expect(parsedResult.getDate()).toEqual(originalDate.getDate());

      const timeDiff = parsedResult.getTime() - originalDate.getTime();
      expect(timeDiff % (60 * 60 * 1000)).toBe(0);

      expect(parsedResult.getMinutes()).toEqual(originalDate.getUTCMinutes());
    });
  });

  describe('when given invalid input', () => {
    test('returns empty string for empty input', () => {
      expect(isoDateLocalDate('')).toEqual('');
    });

    test('returns empty string for null input', () => {
      expect(isoDateLocalDate('null')).toEqual('');
    });

    test('returns "Invalid Date" for non-date strings', () => {
      const result = isoDateLocalDate('not a date');
      expect(result).toBe('Invalid Date');
    });
  });

  describe('when handling Daylight Saving Time changes', () => {
    test('correctly adjusts for DST transitions', () => {
      const beforeDST = '2024-03-31T00:30:00Z';
      const afterDST = '2024-03-31T03:30:00Z';

      const resultBefore = isoDateLocalDate(beforeDST);
      const resultAfter = isoDateLocalDate(afterDST);

      const parsedBefore = parseTestDateTime(resultBefore);
      const parsedAfter = parseTestDateTime(resultAfter);

      expect(parsedAfter.getTime() - parsedBefore.getTime()).toBe(3 * 60 * 60 * 1000);
    });
  });

  describe('when given different UTC date formats', () => {
    test('handles various ISO 8601 formats consistently', () => {
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
  });

  describe('when handling extreme dates', () => {
    test('processes dates from 1900 to 2100 without errors', () => {
      const extremeDates = [
        '1900-01-01T00:00:00Z',
        '2100-12-31T23:59:59Z',
      ];

      extremeDates.forEach(date => {
        const result = isoDateLocalDate(date);
        expect(result).not.toEqual('Invalid Date');
        const parsed = parseTestDateTime(result);
        expect(parsed.getTime()).not.toBeNaN();
      });
    });
  });

  describe('when processing milliseconds', () => {
    test('does not preserve millisecond precision', () => {
      const input = '2024-07-18T15:30:00.123Z';
      const result = isoDateLocalDate(input);
      const parsed = parseTestDateTime(result);
      expect(parsed.getMilliseconds()).not.toBe(123);
    });
  });

  describe('when used across different time zones', () => {
    test('produces consistent results with differing local times', () => {
      const input = new Date().toISOString();
      const mockTimezones: TimeZone[] = ['Australia/Adelaide', 'US/Eastern', 'Europe/London'];

      const results = mockTimezones.map((zone: TimeZone) => {
        register(zone);
        const result = isoDateLocalDate(input);
        unregister();
        return result;
      });

      const hours = results.map(r => parseTestDateTime(r).getHours());
      expect(new Set(hours).size).toBeGreaterThan(1);

      let currentTimezone = 'US/Pacific';
      register(currentTimezone as TimeZone);
      expect(isoDateLocalDate(input)).toMatch(formatTestDateTime(new Date(), currentTimezone));
      unregister();

      currentTimezone = 'Europe/London';
      register(currentTimezone as TimeZone);
      expect(isoDateLocalDate(input)).toMatch(formatTestDateTime(new Date(), currentTimezone));
      unregister();
    });
  });
});

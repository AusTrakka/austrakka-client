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

  describe('when given a valid UTC timestamp', () => {
    test('converts to correct local date without time', () => {
      const date = new Date();
      const result = isoDateLocalDateNoTime(date.toISOString());
      const expected = formatTestDate(date);
      expect(result).toEqual(expected);

      const parsedResult = parseTestDate(result);
      expect(parsedResult.getUTCMonth()).toEqual(date.getUTCMonth());
      expect(parsedResult.getUTCDate()).toEqual(date.getUTCDate());
      expect(result).toMatch(expected);
    });

    test('preserves date components correctly for different input dates', () => {
      const differentDate = new Date('2024-07-19T15:30:00Z');
      const result = isoDateLocalDateNoTime(differentDate.toISOString());
      const parsedResult = parseTestDate(result);

      expect(parsedResult.getUTCFullYear()).toEqual(differentDate.getFullYear());
      expect(parsedResult.getUTCMonth()).toEqual(differentDate.getMonth());
      expect(parsedResult.getUTCDate()).toEqual(differentDate.getDate());
    });
  });

  describe('when given invalid input', () => {
    test('returns empty string for empty input', () => {
      expect(isoDateLocalDateNoTime('')).toEqual('');
    });

    test('returns empty string for null input', () => {
      expect(isoDateLocalDateNoTime('null')).toEqual('');
    });

    test('returns "Invalid Date" for non-date strings', () => {
      const result = isoDateLocalDateNoTime('not a date');
      expect(result).toBe('Invalid Date');
    });
  });

  describe('when handling Daylight Saving Time changes', () => {
    test('produces the same date for times before and after DST transition', () => {
      const beforeDST = new Date('2024-03-31T00:30:00Z');
      const afterDST = new Date('2024-03-31T03:30:00Z');

      const resultBefore = isoDateLocalDateNoTime(beforeDST.toISOString());
      const resultAfter = isoDateLocalDateNoTime(afterDST.toISOString());

      const parsedBefore = parseTestDate(resultBefore);
      const parsedAfter = parseTestDate(resultAfter);

      expect(parsedAfter.getTime() - parsedBefore.getTime()).toBe(0);
    });
  });

  describe('when given different UTC date formats', () => {
    test('handles various ISO 8601 formats consistently', () => {
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
  });

  describe('when handling extreme dates', () => {
    test('processes dates from 1900 to 2100 without errors', () => {
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
  });

  describe('when processing time components', () => {
    test('removes all time information from the result', () => {
      const input = new Date().toISOString().replace('.000Z', '.123Z');
      const result = isoDateLocalDateNoTime(input);
      const parsed = parseTestDate(result);
      expect(parsed.getUTCHours()).toBe(0);
      expect(parsed.getUTCMinutes()).toBe(0);
      expect(parsed.getUTCSeconds()).toBe(0);
      expect(parsed.getUTCMilliseconds()).toBe(0);
    });
  });

  describe('when used across different time zones', () => {
    test('produces consistent results regardless of timezone', () => {
      const input = new Date();
      const mockTimezones: TimeZone[] = ['Australia/Adelaide', 'US/Eastern', 'Europe/London', 'US/Pacific', 'Etc/GMT+9', 'Etc/GMT-9', 'UTC'];

      const results = mockTimezones.map(zone => {
        register(zone);
        const result = isoDateLocalDateNoTime(input.toISOString());
        const expected = formatTestDate(input, zone);
        unregister();
        return { zone, result, expected };
      });

      results.forEach(item => {
        expect(item.result).toMatch(item.expected);
      });
    });
  });
});

import { register, unregister } from 'timezone-mock';
import { formatDate } from '../../../src/utilities/helperUtils';

describe('formatDate', () => {
  const originalDateParse = Date.parse;

  beforeAll(() => {
    jest.useFakeTimers();
    register('UTC');
    jest.setSystemTime(new Date('2024-07-22T02:00:00.000Z'));
    Date.parse = jest.fn((dateString) => {
      const timestamp = originalDateParse(dateString);
      return Number.isNaN(timestamp) ? NaN : timestamp;
    });
  });

  afterAll(() => {
    jest.useRealTimers();
    unregister();
  });

  describe('when given the current date', () => {
    it('returns a formatted string with day, date, month, year, time, and timezone', () => {
      const result = formatDate(new Date().toISOString());
      expect(result).toBe('Mon, 22 July 2024, 2:00 am UTC');
    });
  });

  describe('when given different times of day', () => {
    it('correctly formats morning and evening times', () => {
      const morning = '2024-07-22T08:15:00Z';
      const evening = '2024-07-22T20:45:00Z';
      expect(formatDate(morning)).toBe('Mon, 22 July 2024, 8:15 am UTC');
      expect(formatDate(evening)).toBe('Mon, 22 July 2024, 8:45 pm UTC');
    });
  });

  describe('when given a date from a different year', () => {
    it('formats the date with the correct year and handles year-end scenarios', () => {
      const input = '2023-12-31T23:59:59Z';
      const result = formatDate(input);
      expect(result).toBe('Sun, 31 Dec 2023, 11:59 pm UTC');
    });
  });

  describe('when given invalid input', () => {
    it('returns "Invalid Date" for non-date strings', () => {
      const result = formatDate('not a date');
      expect(result).toBe('Invalid Date');
    });
  });
});

import { generateDateFilterString } from '../../../src/utilities/helperUtils';

describe('generateDateFilterString', () => {
  describe('when given a valid date object', () => {
    test('produces a correctly formatted filter string with field, condition, and ISO date', () => {
      const dateObject = {
        field: 'createdAt',
        condition: '>',
        fieldType: 'date',
        value: { $d: new Date('2023-07-23T00:00:00Z') },
      };
      const expectedOutput = 'SSKV>=createdAt|2023-07-23T00:00:00.000Z';
      const result = generateDateFilterString(dateObject);
      expect(result).toBe(expectedOutput);
    });
  });

  describe('when given an empty date object', () => {
    test('returns an empty string', () => {
      const dateObject = {};
      const expectedOutput = '';
      const result = generateDateFilterString(dateObject as any);
      expect(result).toBe(expectedOutput);
    });
  });

  describe('when given a date object with missing fields', () => {
    test('returns an empty string if required fields are absent', () => {
      const dateObject = {
        field: 'createdAt',
        condition: '>',
        fieldType: 'date',
        // Missing value field
      };
      const expectedOutput = '';
      const result = generateDateFilterString(dateObject as any);
      expect(result).toBe(expectedOutput);
    });
  });

  describe('when given a date object with an invalid date value', () => {
    test('returns an empty string for non-date values', () => {
      const dateObject = {
        field: 'createdAt',
        condition: '>',
        fieldType: 'date',
        value: { $d: 'invalid-date' },
      };
      const expectedOutput = '';
      const result = generateDateFilterString(dateObject);
      expect(result).toBe(expectedOutput);
    });
  });
});

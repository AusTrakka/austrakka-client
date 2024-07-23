import { generateDateFilterString } from '../../../src/utilities/helperUtils';

describe('generateDateFilterString', () => {
  test('should generate a filter string for a valid date object', () => {
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

  test('should return an empty string for an empty date object', () => {
    const dateObject = {};
    const expectedOutput = '';

    const result = generateDateFilterString(dateObject as any);
    expect(result).toBe(expectedOutput);
  });

  test('should return an empty string for a date object with missing fields', () => {
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

  test('should return an empty string for a date object with an invalid date value', () => {
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

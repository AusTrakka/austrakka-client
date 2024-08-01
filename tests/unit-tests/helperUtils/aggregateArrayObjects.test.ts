import { aggregateArrayObjects } from '../../../src/utilities/helperUtils';

describe('aggregateArrayObjects', () => {
  describe('when given an input of expected data with singular datatype', () => {
    test('merge unque values with associated count', () => {
      const inputArray = [
        { category: 'A' },
        { category: 'B' },
        { category: 'A' },
        { category: 'C' },
        { category: 'B' },
        { category: 'A' },
      ];
      const expectedOutput = [
        { category: 'A', sampleCount: 3 },
        { category: 'B', sampleCount: 2 },
        { category: 'C', sampleCount: 1 },
      ];

      const result = aggregateArrayObjects('category', inputArray);
      expect(result).toEqual(expectedOutput);
    });
  });
  describe('when given variations of invalid' +
         'input or values within the input', () => {
    test('undefined arrays are converted to empty arrays', () => {
      const inputArray = undefined;
      const expectedOutput: any[] = [];

      const result = aggregateArrayObjects('category', inputArray as any);
      expect(result).toEqual(expectedOutput);
    });

    test('empty array should be returned', () => {
      const inputArray: any[] = [];
      const expectedOutput: any[] = [];

      const result = aggregateArrayObjects('category', inputArray);
      expect(result).toEqual(expectedOutput);
    });

    test('merge array with null or undefined values as its own unqiue value', () => {
      const inputArray = [
        { category: 'A' },
        { category: null },
        { category: 'B' },
        { category: 'A' },
        { category: undefined },
        { category: 'A' },
      ];
      const expectedOutput = [
        { category: 'A', sampleCount: 3 },
        { category: null, sampleCount: 1 },
        { category: 'B', sampleCount: 1 },
        { category: undefined, sampleCount: 1 },
      ];

      const result = aggregateArrayObjects('category', inputArray);
      expect(result).toEqual(expectedOutput);
    });
  });

  describe('when given edgecase input and usecases', () => {
    test('mixed type inputs work', () => {
      const inputArray = [
        { category: 'A' },
        { category: 1 },
        { category: 'A' },
        { category: '1' },
        { category: 1 },
      ];
      const expectedOutput = [
        { category: 'A', sampleCount: 2 },
        { category: 1, sampleCount: 2 },
        { category: '1', sampleCount: 1 },
      ];

      const result = aggregateArrayObjects('category', inputArray);
      expect(result).toEqual(expectedOutput);
    });

    test('non objects in array are ignored', () => {
      const inputArray = [
        { category: 'A' },
        'string',
        { category: 'A' },
        null,
        { category: 'B' },
        { category: 'A' },
      ];
      const expectedOutput = [
        { category: 'A', sampleCount: 3 },
        { category: 'B', sampleCount: 1 },
      ];

      const result = aggregateArrayObjects('category', inputArray);
      expect(result).toEqual(expectedOutput);
    });

    test('input without specified property will return empty array', () => {
      const inputArray = [
        { name: 'A' },
        { name: 'B' },
        { name: 'A' },
      ];
      const expectedOutput: any[] = [];

      const result = aggregateArrayObjects('category', inputArray);
      expect(result).toEqual(expectedOutput);
    });

    test('non-array inputs are returned as an empty array', () => {
      const input = { category: 'A' };
      const expectedOutput: any[] = [];

      const result = aggregateArrayObjects('category', input as any);
      expect(result).toEqual(expectedOutput);
    });
  });
});

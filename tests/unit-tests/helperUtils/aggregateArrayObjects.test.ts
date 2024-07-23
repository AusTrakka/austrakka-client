import { aggregateArrayObjects } from '../../../src/utilities/helperUtils';

describe('aggregateArrayObjects', () => {
  test('should aggregate counts correctly for a given property', () => {
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

  test('should return an empty array if input array is empty', () => {
    const inputArray: any[] = [];
    const expectedOutput: any[] = [];

    const result = aggregateArrayObjects('category', inputArray);
    expect(result).toEqual(expectedOutput);
  });

  test('should handle undefined input array gracefully', () => {
    const inputArray = undefined;
    const expectedOutput: any[] = [];

    const result = aggregateArrayObjects('category', inputArray as any);
    expect(result).toEqual(expectedOutput);
  });

  test('should handle input array with null or undefined values', () => {
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

  test('should handle input array with mixed types', () => {
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

  test('should handle input array with non-object elements', () => {
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

  test('should return empty array for array without specified property', () => {
    const inputArray = [
      { name: 'A' },
      { name: 'B' },
      { name: 'A' },
    ];
    const expectedOutput: any[] = [];

    const result = aggregateArrayObjects('category', inputArray);
    expect(result).toEqual(expectedOutput);
  });

  test('should return empty array for non-array input', () => {
    const input = { category: 'A' };
    const expectedOutput: any[] = [];

    const result = aggregateArrayObjects('category', input as any);
    expect(result).toEqual(expectedOutput);
  });
});

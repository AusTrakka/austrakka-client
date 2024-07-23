import { replaceHasSequencesNullsWithFalse } from '../../../src/utilities/helperUtils';

describe('replaceHasSequencesNullsWithFalse', () => {
  test('should replace null values with false', () => {
    const data = [
      { Has_sequences: null },
      { Has_sequences: true },
      { Has_sequences: false },
      { Has_sequences: '' },
    ];
    const expectedOutput = [
      { Has_sequences: false },
      { Has_sequences: true },
      { Has_sequences: false },
      { Has_sequences: false },
    ];

    const result = replaceHasSequencesNullsWithFalse(data);
    expect(result).toEqual(expectedOutput);
  });

  test('should handle an empty array', () => {
    const data: any[] = [];
    const expectedOutput: any[] = [];

    const result = replaceHasSequencesNullsWithFalse(data);
    expect(result).toEqual(expectedOutput);
  });

  test('should handle objects without the HAS_SEQUENCES property', () => {
    const data = [
      { otherProperty: 'value' },
      { Has_sequences: null },
      { Has_sequences: '' },
    ];
    const expectedOutput = [
      { otherProperty: 'value' },
      { Has_sequences: false },
      { Has_sequences: false },
    ];

    const result = replaceHasSequencesNullsWithFalse(data);
    expect(result).toEqual(expectedOutput);
  });

  test('should handle objects with other data types', () => {
    const data = [
      { Has_sequences: 123 },
      { Has_sequences: true },
      { Has_sequences: false },
      { Has_sequences: { nested: 'object' } },
    ];
    const expectedOutput = [
      { Has_sequences: 123 },
      { Has_sequences: true },
      { Has_sequences: false },
      { Has_sequences: { nested: 'object' } },
    ];

    const result = replaceHasSequencesNullsWithFalse(data);
    expect(result).toEqual(expectedOutput);
  });
});

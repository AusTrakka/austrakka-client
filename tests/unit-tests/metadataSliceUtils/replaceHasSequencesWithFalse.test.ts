import { replaceHasSequencesNullsWithFalse } from '../../../src/app/metadataSliceUtils';

describe('replaceHasSequencesNullsWithFalse', () => {
  describe('when given an array with Has_sequences property', () => {
    test('replaces null values with false', () => {
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
  });

  describe('when given an empty array', () => {
    test('handles an empty array', () => {
      const data: any[] = [];
      const expectedOutput: any[] = [];

      const result = replaceHasSequencesNullsWithFalse(data);
      expect(result).toEqual(expectedOutput);
    });
  });

  describe('when objects do not have Has_sequences property', () => {
    test('handles objects without the Has_sequences property', () => {
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
  });

  describe('when given objects with other data types in Has_sequences', () => {
    test('handles objects with other data types', () => {
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
});

import { replaceNullsWithEmpty } from '../../../src/app/metadataSliceUtils';

describe('replaceNullsWithEmpty', () => {
  describe('when given an array with null values', () => {
    test('replaces null values with empty strings', () => {
      const data = [
        { name: 'Alice', age: null, email: 'alice@example.com' },
        { name: 'Bob', age: 30, email: null },
        { name: null, age: 25, email: 'bob@example.com' },
      ];
      const expectedOutput = [
        { name: 'Alice', age: '', email: 'alice@example.com' },
        { name: 'Bob', age: 30, email: '' },
        { name: '', age: 25, email: 'bob@example.com' },
      ];

      replaceNullsWithEmpty(data);
      expect(data).toEqual(expectedOutput);
    });
  });

  describe('when given an empty array', () => {
    test('handles an empty array', () => {
      const data: any[] = [];
      const expectedOutput: any[] = [];

      replaceNullsWithEmpty(data);
      expect(data).toEqual(expectedOutput);
    });
  });

  describe('when given objects with no null values', () => {
    test('handles objects with no null values', () => {
      const data = [
        { name: 'Alice', age: 25, email: 'alice@example.com' },
        { name: 'Bob', age: 30, email: 'bob@example.com' },
      ];
      const expectedOutput = [
        { name: 'Alice', age: 25, email: 'alice@example.com' },
        { name: 'Bob', age: 30, email: 'bob@example.com' },
      ];

      replaceNullsWithEmpty(data);
      expect(data).toEqual(expectedOutput);
    });
  });

  describe('when given objects with mixed data types', () => {
    test('handles objects with mixed data types', () => {
      const data = [
        { name: 'Alice', age: null, isActive: true, details: { id: null } },
        { name: null, age: 30, isActive: false, details: { id: '123' } },
      ];
      const expectedOutput = [
        { name: 'Alice', age: '', isActive: true, details: { id: '' } },
        { name: '', age: 30, isActive: false, details: { id: '123' } },
      ];

      replaceNullsWithEmpty(data);
      expect(data).toEqual(expectedOutput);
    });
  });
});

import { getEmptyStringColumns } from '../../../src/app/metadataSliceUtils';

describe('getEmptyStringColumns', () => {
  describe('when given data with some fields that are all empty strings', () => {
    test('returns only the fields where all values are empty strings', () => {
      const data = [
        { name: '', age: '', email: 'alice@example.com' },
        { name: '', age: '', email: 'bob@example.com' },
        { name: '', age: '', email: 'carol@example.com' },
      ];
      const fields = ['name', 'age', 'email'];

      const result = getEmptyStringColumns(data, fields);

      expect(result).toEqual(['name', 'age']);
    });
  });

  describe('when no fields are completely empty strings', () => {
    test('returns an empty array', () => {
      const data = [
        { name: 'Alice', age: '', email: '' },
        { name: '', age: '30', email: '' },
        { name: '', age: '', email: 'carol@example.com' },
      ];
      const fields = ['name', 'age', 'email'];

      const result = getEmptyStringColumns(data, fields);

      expect(result).toEqual([]);
    });
  });

  describe('when data is an empty array', () => {
    test('returns an empty array', () => {
      const data: any[] = [];
      const fields = ['name', 'age', 'email'];

      const result = getEmptyStringColumns(data, fields);

      expect(result).toEqual([]);
    });
  });

  describe('when given a subset of fields', () => {
    test('only considers the provided fields', () => {
      const data = [
        { name: '', age: '', email: '' },
        { name: '', age: '', email: 'bob@example.com' },
      ];
      const fields = ['name', 'age'];

      const result = getEmptyStringColumns(data, fields);

      expect(result).toEqual(['name', 'age']);
    });
  });

  describe('when some samples are missing a field', () => {
    test('treats missing fields as undefined and does not count them as empty strings', () => {
      const data = [
        { name: '', age: '', email: '' },
        { name: '', email: '' }, // age missing
      ];
      const fields = ['name', 'age', 'email'];

      const result = getEmptyStringColumns(data, fields);

      expect(result).toEqual(['name', 'email']); // 'age' is skipped due to missing value
    });
  });
});

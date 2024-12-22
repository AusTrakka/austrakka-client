import { countPresentOrMissingByCategory } from '../../../src/utilities/dataProcessingUtils';

describe('countPresentOrMissingByCategory', () => {
  test('given an empty input array, returns an empty result', () => {
    const input: any[] = [];
    const property = 'someProperty';
    const category = 'someCategory';
    const result = countPresentOrMissingByCategory(property, category, input);
    expect(result).toEqual([]);
  });

  test('given an array with all relevant values populated, returns correct counts', () => {
    const input = [
      { someProperty: 'value1', someCategory: 'category1', otherProperty: null },
      { someProperty: 'value2', someCategory: 'category2', otherProperty: 'value2' },
      { someProperty: 'value3', someCategory: 'category1', otherProperty: 'value3' },
    ];
    const property = 'someProperty';
    const category = 'someCategory';
    const result = countPresentOrMissingByCategory(property, category, input);
    expect(result).toEqual([
      { [category]: 'category1', 'Available': 2, 'Missing': 0 },
      { [category]: 'category2', 'Available': 1, 'Missing': 0 },
    ]);
  });

  test('given an array with some relevant values empty, returns correct counts', () => {
    const input = [
      { someProperty: 'value1', someCategory: 'category1', otherProperty: null },
      { someProperty: '', someCategory: 'category2', otherProperty: 'value2' },
      { someProperty: 'value3', someCategory: 'category1', otherProperty: 'value3' },
    ];
    const property = 'someProperty';
    const category = 'someCategory';
    const result = countPresentOrMissingByCategory(property, category, input);
    expect(result).toEqual([
      { [category]: 'category1', 'Available': 2, 'Missing': 0 },
      { [category]: 'category2', 'Available': 0, 'Missing': 1 },
    ]);
  });

  test('given an array with some relevant values null, returns correct counts', () => {
    const input = [
      { someProperty: 'value1', someCategory: 'category1', otherProperty: null },
      { someProperty: null, someCategory: 'category2', otherProperty: 'value2' },
      { someProperty: 'value3', someCategory: 'category1', otherProperty: 'value3' },
    ];
    const property = 'someProperty';
    const category = 'someCategory';
    const result = countPresentOrMissingByCategory(property, category, input);
    expect(result).toEqual([
      { [category]: 'category1', 'Available': 2, 'Missing': 0 },
      { [category]: 'category2', 'Available': 0, 'Missing': 1 },
    ]);
  });

  test('given an array, returns correct category list', () => {
    const input = [
      { someProperty: 'value1', someCategory: 'category1', otherProperty: null },
      { someProperty: 'value2', someCategory: 'category2', otherProperty: 'value2' },
      { someProperty: 'value3', someCategory: 'category1', otherProperty: 'value3' },
    ];
    const property = 'someProperty';
    const category = 'someCategory';
    const result = countPresentOrMissingByCategory(property, category, input);
    expect(new Set(result.map((r) => r[category]))).toEqual(
      new Set(['category1', 'category2']),
    );
  });

  test('given an array with some category values empty, treats these as a separate category', () => {
    const input = [
      { someProperty: 'value1', someCategory: 'category1', otherProperty: null },
      { someProperty: 'value2', someCategory: '', otherProperty: 'value2' },
      { someProperty: 'value3', someCategory: '', otherProperty: 'value3' },
    ];
    const property = 'someProperty';
    const category = 'someCategory';
    const result = countPresentOrMissingByCategory(property, category, input);
    expect(result).toEqual([
      { [category]: 'category1', 'Available': 1, 'Missing': 0 },
      { [category]: '', 'Available': 2, 'Missing': 0 },
    ]);
  });

  test('given an array with category field missing, raises an error', () => {
    const input = [
      { someProperty: 'value1', otherProperty: null },
      { someProperty: 'value2', otherProperty: 'value2' },
      { someProperty: 'value3', otherProperty: 'value3' },
    ];
    const property = 'someProperty';
    const category = 'someCategory';
    expect(() => countPresentOrMissingByCategory(property, category, input)).toThrow();
  });

  test('given an array with property field missing, raises an error', () => {
    const input = [
      { someCategory: 'category1', otherProperty: null },
      { someCategory: 'category2', otherProperty: 'value2' },
      { someCategory: 'category1', otherProperty: 'value3' },
    ];
    const property = 'someProperty';
    const category = 'someCategory';
    expect(() => countPresentOrMissingByCategory(property, category, input)).toThrow();
  });
});

import { topCategories } from '../../../src/utilities/dataProcessingUtils';

describe('topCategories', () => {
  const data = [
    { id: 1, category: 'A', type: 'one', colour: 'red' },
    { id: 2, category: 'B', type: 'two', colour: 'blue' },
    { id: 3, category: 'A', type: 'one', colour: 'red' },
    { id: 4, category: 'C', type: 'three', colour: 'green' },
    { id: 5, category: 'B', type: 'two', colour: 'blue' },
    { id: 6, category: 'D', type: 'four', colour: 'yellow' },
    { id: 7, category: 'B', type: 'two', colour: 'blue' },
    { id: 8, category: 'D', type: 'four', colour: 'yellow' },
    { id: 9, category: 'D', type: 'four', colour: 'yellow' },
    { id: 10, category: 'D', type: 'three', colour: 'yellow' },
  ];

  test('aggregates on field and returns top N categories based on count', () => {
    const result = topCategories(data, 'category', 2);
    expect(result.categories).toEqual([
      { category: 'D', count: 4 },
      { category: 'B', count: 3 },
    ]);
  });

  test('groups remaining categories into "other" when limit is exceeded', () => {
    const result = topCategories(data, 'category', 2);
    expect(result.other).toEqual({
      count: 3, // A: 2 + C: 1
      categories: ['A', 'C'],
    });
  });

  test('returns all categories with no "other" if limit exceeds data length', () => {
    const result = topCategories(data, 'colour', 10);
    expect(result.categories).toEqual([
      { category: 'yellow', count: 4 },
      { category: 'blue', count: 3 },
      { category: 'red', count: 2 },
      { category: 'green', count: 1 },
    ]);
    expect(result.other).toBeUndefined();
  });

  test('handles empty input array', () => {
    const result = topCategories([], 'category', 2);
    expect(result.categories).toEqual([]);
    expect(result.other).toBeUndefined();
  });

  test('handles ties in counts', () => {
    const tieData = [
      { id: 1, category: 'A' },
      { id: 2, category: 'B' },
      { id: 3, category: 'A' },
      { id: 4, category: 'B' },
    ];
    const result = topCategories(tieData, 'category', 2);
    expect(result.categories).toEqual([
      { category: 'A', count: 2 },
      { category: 'B', count: 2 },
    ]);
    expect(result.other).toBeUndefined();
  });

  test('returns all categories sorted by count when no limit is provided', () => {
    const result = topCategories(data, 'type');
    expect(result.categories).toEqual([
      { category: 'two', count: 3 },
      { category: 'four', count: 3 },
      { category: 'one', count: 2 },
      { category: 'three', count: 2 },
    ]);
    expect(result.other).toBeUndefined();
  });

  test('ignores empty/null values when limit is set and keepEmpty is false', () => {
    const dataWithEmpty = [
      { id: 1, category: 'A' },
      { id: 2, category: '' },
      { id: 3, category: null },
      { id: 4, category: 'A' },
    ];
    const result = topCategories(dataWithEmpty, 'category', 2);
    expect(result.categories).toEqual([{ category: 'A', count: 2 }]);
    expect(result.other).toBeUndefined();
  });

  test('keeps empty/null values as a single "" category when keepEmpty is true', () => {
    const dataWithEmpty = [
      { id: 1, category: 'A' },
      { id: 2, category: '' },
      { id: 3, category: null },
      { id: 4, category: 'A' },
    ];
    const result = topCategories(dataWithEmpty, 'category', 2, true);
    expect(result.categories).toEqual([
      { category: 'A', count: 2 },
      { category: '', count: 2 },
    ]);
    expect(result.other).toBeUndefined();
  });
});

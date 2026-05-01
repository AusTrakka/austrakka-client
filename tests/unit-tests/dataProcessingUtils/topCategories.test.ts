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
    expect(result).toEqual(['D', 'B']);
  });

  test('returns all categories if limit exceeds data length', () => {
    const result = topCategories(data, 'colour', 10);
    expect(result).toEqual(['yellow', 'blue', 'red', 'green']);
  });

  test('handles empty input array', () => {
    const result = topCategories([], 'category', 2);
    expect(result).toEqual([]);
  });

  test('handles ties in counts', () => {
    const tieData = [
      { id: 1, category: 'A' },
      { id: 2, category: 'B' },
      { id: 3, category: 'A' },
      { id: 4, category: 'B' },
    ];
    const result = topCategories(tieData, 'category', 2);
    expect(result).toEqual(['A', 'B']);
  });

  test('returns all categories sorted by count when no limit is provided', () => {
    const result = topCategories(data, 'type');
    expect(result).toEqual(['two', 'four', 'one', 'three']);
  });
});

import { CustomFilterOperators } from '../../../src/components/DataFilters/fieldTypeOperators';
import { filterExcluded } from '../../../src/utilities/dataProcessingUtils';

// TODO: Add tests for null/empty operators

describe('filterExcluded', () => {
  test('filters out objects based on specified field and value', () => {
    const data = [
      { id: 1, category: 'A' },
      { id: 2, category: 'B' },
      { id: 3, category: 'A' },
      { id: 4, category: 'C' },
    ];
    const exclude = [{ field: 'category', value: 'A' }];

    const result = filterExcluded(data, exclude);
    expect(result).toEqual([
      { id: 2, category: 'B' },
      { id: 4, category: 'C' },
    ]);
  });

  test('returns original array if exclude is undefined', () => {
    const data = [
      { id: 1, category: 'A' },
      { id: 2, category: 'B' },
    ];

    const result = filterExcluded(data, undefined);
    expect(result).toEqual(data);
  });

  test('returns original array if exclude is empty', () => {
    const data = [
      { id: 1, category: 'A' },
      { id: 2, category: 'B' },
    ];
    const exclude: any[] = [];

    const result = filterExcluded(data, exclude);
    expect(result).toEqual(data);
  });

  test('handles multiple exclusion criteria', () => {
    const data = [
      { id: 1, category: 'A', type: 'X' },
      { id: 2, category: 'B', type: 'Y' },
      { id: 3, category: 'A', type: 'Y' },
      { id: 4, category: 'C', type: 'X' },
    ];
    const exclude = [
      { field: 'category', value: 'A' },
      { field: 'type', value: 'X' },
    ];

    const result = filterExcluded(data, exclude);
    expect(result).toEqual([{ id: 2, category: 'B', type: 'Y' }]);
  });

  test('handles null or empty exclusion criteria', () => {
    const data = [
      { id: 1, category: 'A' },
      { id: 2, category: '' },
      { id: 3, category: null },
    ];
    const exclude = [{ field: 'category', value: CustomFilterOperators.NULL_OR_EMPTY }];

    const result = filterExcluded(data, exclude);
    expect(result).toEqual([{ id: 1, category: 'A' }]);
  });

  test('handles not null or empty exclusion criteria', () => {
    const data = [
      { id: 1, category: 'A' },
      { id: 2, category: '' },
      { id: 3, category: null },
    ];
    const exclude = [{ field: 'category', value: CustomFilterOperators.NOT_NULL_OR_EMPTY }];

    const result = filterExcluded(data, exclude);
    expect(result).toEqual([
      { id: 2, category: '' },
      { id: 3, category: null },
    ]);
  });
});

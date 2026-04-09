import { CustomFilterOperators } from '../../../src/components/DataFilters/fieldTypeOperators';
import { filterIncluded } from '../../../src/utilities/dataProcessingUtils';

describe('filterIncluded', () => {
  test('filters in objects based on specified field and value', () => {
    const data = [
      { id: 1, category: 'A' },
      { id: 2, category: 'B' },
      { id: 3, category: 'A' },
      { id: 4, category: 'C' },
    ];
    const include = [{ field: 'category', value: 'A' }];

    const result = filterIncluded(data, include);
    expect(result).toEqual([
      { id: 1, category: 'A' },
      { id: 3, category: 'A' },
    ]);
  });

  test('returns all data if include is undefined', () => {
    const data = [
      { id: 1, category: 'A' },
      { id: 2, category: 'B' },
    ];

    const result = filterIncluded(data, undefined);
    expect(result).toEqual(data);
  });

  test('returns all data if include is empty', () => {
    const data = [
      { id: 1, category: 'A' },
      { id: 2, category: 'B' },
    ];
    const include: any[] = [];

    const result = filterIncluded(data, include);
    expect(result).toEqual(data);
  });

  test('handles multiple inclusion criteria', () => {
    const data = [
      { id: 1, category: 'A', type: 'X' },
      { id: 2, category: 'B', type: 'Y' },
      { id: 3, category: 'A', type: 'Y' },
      { id: 4, category: 'C', type: 'X' },
    ];
    const include = [
      { field: 'category', value: 'A' },
      { field: 'type', value: 'X' },
    ];

    const result = filterIncluded(data, include);
    expect(result).toEqual([{ id: 1, category: 'A', type: 'X' }]);
  });

  test('returns empty array if no items match inclusion criteria', () => {
    const data = [
      { id: 1, category: 'A' },
      { id: 2, category: 'B' },
    ];
    const include = [{ field: 'category', value: 'C' }];

    const result = filterIncluded(data, include);
    expect(result).toEqual([]);
  });

  test('handles null or empty inclusion criteria', () => {
    const data = [
      { id: 1, category: 'A' },
      { id: 2, category: '' },
      { id: 3, category: null },
    ];
    const include = [{ field: 'category', value: CustomFilterOperators.NULL_OR_EMPTY }];

    const result = filterIncluded(data, include);
    expect(result).toEqual([
      { id: 2, category: '' },
      { id: 3, category: null },
    ]);
  });

  test('handles not null or empty inclusion criteria', () => {
    const data = [
      { id: 1, category: 'A' },
      { id: 2, category: '' },
      { id: 3, category: null },
    ];
    const include = [{ field: 'category', value: CustomFilterOperators.NOT_NULL_OR_EMPTY }];

    const result = filterIncluded(data, include);
    expect(result).toEqual([{ id: 1, category: 'A' }]);
  });
});

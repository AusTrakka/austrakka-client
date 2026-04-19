import { pruneColumns } from '../../../src/utilities/dataProcessingUtils';

describe('pruneColumns', () => {
  it('should return original data if columnsToKeep is empty', () => {
    const data = [
      { id: 1, name: 'Alice', age: 30 },
      { id: 2, name: 'Bob', age: 25 },
    ];
    expect(pruneColumns(data, [])).toEqual(data);
  });

  it('should prune columns correctly', () => {
    const data = [
      { id: 1, name: 'Alice', age: 30 },
      { id: 2, name: 'Bob', age: 25 },
    ];
    const expected = [{ name: 'Alice' }, { name: 'Bob' }];
    expect(pruneColumns(data, ['name'])).toEqual(expected);
  });

  it('should handle case where all columns are kept', () => {
    const data = [
      { id: 1, name: 'Alice', age: 30 },
      { id: 2, name: 'Bob', age: 25 },
    ];
    expect(pruneColumns(data, ['id', 'name', 'age'])).toEqual(data);
  });
});

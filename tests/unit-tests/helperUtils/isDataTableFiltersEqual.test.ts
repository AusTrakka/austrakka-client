import { DataTableFilterMeta } from 'primereact/datatable';
import { isDataTableFiltersEqual } from '../../../src/utilities/helperUtils';

describe('isDataTableFiltersEqual', () => {
  test('should return true for equal simple filter objects', () => {
    const obj1: DataTableFilterMeta = {
      name: { value: 'John', matchMode: 'equals' },
    };
    const obj2: DataTableFilterMeta = {
      name: { value: 'John', matchMode: 'equals' },
    };

    expect(isDataTableFiltersEqual(obj1, obj2)).toBe(true);
  });

  test('should return false for different simple filter objects', () => {
    const obj1: DataTableFilterMeta = {
      name: { value: 'John', matchMode: 'equals' },
    };
    const obj2: DataTableFilterMeta = {
      name: { value: 'Doe', matchMode: 'equals' },
    };

    expect(isDataTableFiltersEqual(obj1, obj2)).toBe(false);
  });

  test('should return true for equal operator filter objects', () => {
    const obj1: DataTableFilterMeta = {
      name: {
        operator: 'or',
        constraints: [
          { value: 'John', matchMode: 'equals' },
          { value: 'Doe', matchMode: 'equals' },
        ],
      },
    };
    const obj2: DataTableFilterMeta = {
      name: {
        operator: 'or',
        constraints: [
          { value: 'John', matchMode: 'equals' },
          { value: 'Doe', matchMode: 'equals' },
        ],
      },
    };

    expect(isDataTableFiltersEqual(obj1, obj2)).toBe(true);
  });

  test('should return false for different operator filter objects', () => {
    const obj1: DataTableFilterMeta = {
      name: {
        operator: 'or',
        constraints: [
          { value: 'John', matchMode: 'equals' },
          { value: 'Doe', matchMode: 'equals' },
        ],
      },
    };
    const obj2: DataTableFilterMeta = {
      name: {
        operator: 'or',
        constraints: [
          { value: 'John', matchMode: 'equals' },
          { value: 'Smtesth', matchMode: 'equals' },
        ],
      },
    };

    expect(isDataTableFiltersEqual(obj1, obj2)).toBe(false);
  });

  test('should return false for different keys', () => {
    const obj1: DataTableFilterMeta = {
      name: { value: 'John', matchMode: 'equals' },
    };
    const obj2: DataTableFilterMeta = {
      age: { value: 30, matchMode: 'gt' },
    };

    expect(isDataTableFiltersEqual(obj1, obj2)).toBe(false);
  });

  test('should return false for different lengths of keys', () => {
    const obj1: DataTableFilterMeta = {
      name: { value: 'John', matchMode: 'equals' },
      age: { value: 30, matchMode: 'gt' },
    };
    const obj2: DataTableFilterMeta = {
      name: { value: 'John', matchMode: 'equals' },
    };

    expect(isDataTableFiltersEqual(obj1, obj2)).toBe(false);
  });

  test('should return true for empty filter objects', () => {
    const obj1: DataTableFilterMeta = {};
    const obj2: DataTableFilterMeta = {};

    expect(isDataTableFiltersEqual(obj1, obj2)).toBe(true);
  });

  test('should return false for mixed operator and simple filters', () => {
    const obj1: DataTableFilterMeta = {
      name: { value: 'John', matchMode: 'equals' },
    };
    const obj2: DataTableFilterMeta = {
      name: {
        operator: 'or',
        constraints: [
          { value: 'John', matchMode: 'equals' },
        ],
      },
    };

    expect(isDataTableFiltersEqual(obj1, obj2)).toBe(false);
  });
});

import { DataTableFilterMeta } from 'primereact/datatable';
import { isDataTableFiltersEqual } from '../../../src/utilities/helperUtils';

describe('isDataTableFiltersEqual', () => {
  describe('when comparing simple filter objects', () => {
    test('returns true for identical filters', () => {
      const obj1: DataTableFilterMeta = {
        name: { value: 'John', matchMode: 'equals' },
      };
      const obj2: DataTableFilterMeta = {
        name: { value: 'John', matchMode: 'equals' },
      };
      expect(isDataTableFiltersEqual(obj1, obj2)).toBe(true);
    });

    test('returns false for filters with different values', () => {
      const obj1: DataTableFilterMeta = {
        name: { value: 'John', matchMode: 'equals' },
      };
      const obj2: DataTableFilterMeta = {
        name: { value: 'Doe', matchMode: 'equals' },
      };
      expect(isDataTableFiltersEqual(obj1, obj2)).toBe(false);
    });
  });

  describe('when comparing operator filter objects', () => {
    test('returns true for identical operator filters', () => {
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

    test('returns false for operator filters with different constraints', () => {
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
            { value: 'Smith', matchMode: 'equals' },
          ],
        },
      };
      expect(isDataTableFiltersEqual(obj1, obj2)).toBe(false);
    });
  });

  describe('when comparing filters with different structures', () => {
    test('returns false for filters with different keys', () => {
      const obj1: DataTableFilterMeta = {
        name: { value: 'John', matchMode: 'equals' },
      };
      const obj2: DataTableFilterMeta = {
        age: { value: 30, matchMode: 'gt' },
      };
      expect(isDataTableFiltersEqual(obj1, obj2)).toBe(false);
    });

    test('returns false for filters with different numbers of keys', () => {
      const obj1: DataTableFilterMeta = {
        name: { value: 'John', matchMode: 'equals' },
        age: { value: 30, matchMode: 'gt' },
      };
      const obj2: DataTableFilterMeta = {
        name: { value: 'John', matchMode: 'equals' },
      };
      expect(isDataTableFiltersEqual(obj1, obj2)).toBe(false);
    });

    test('returns false for mixed operator and simple filters', () => {
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

  describe('when comparing empty filter objects', () => {
    test('returns true for two empty objects', () => {
      const obj1: DataTableFilterMeta = {};
      const obj2: DataTableFilterMeta = {};
      expect(isDataTableFiltersEqual(obj1, obj2)).toBe(true);
    });
  });
});

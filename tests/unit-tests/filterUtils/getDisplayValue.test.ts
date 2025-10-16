import { FilterMatchMode } from 'primereact/api';
import { getDisplayValue } from '../../../src/utilities/filterUtils';

interface DataTableFilterMetaData {
  value: any;
  matchMode: FilterMatchMode | undefined;
}

describe('getDisplayValue', () => {
  const dateConditions = [
    { value: FilterMatchMode.DATE_IS, name: 'Date is' },
    { value: FilterMatchMode.DATE_BEFORE, name: 'Date before' },
    { value: FilterMatchMode.DATE_AFTER, name: 'Date after' },
  ];

  describe('when handling basic values', () => {
    test('returns the string value as-is', () => {
      const constraint: DataTableFilterMetaData = {
        value: 'John',
        matchMode: FilterMatchMode.EQUALS,
      };
      const result = getDisplayValue(constraint, 'Equals', dateConditions);
      expect(result).toBe('John');
    });

    test('returns numeric values as strings', () => {
      const constraint: DataTableFilterMetaData = {
        value: 123,
        matchMode: FilterMatchMode.EQUALS,
      };
      const result = getDisplayValue(constraint, 'Equals', dateConditions);
      expect(result).toBe('123');
    });

    test('returns boolean values as strings', () => {
      const constraint: DataTableFilterMetaData = {
        value: false,
        matchMode: FilterMatchMode.EQUALS,
      };
      const result = getDisplayValue(constraint, 'Equals', dateConditions);
      expect(result).toBe('false');
    });
  });

  describe('when handling array values', () => {
    test('joins string arrays with commas', () => {
      const constraint: DataTableFilterMetaData = {
        value: ['A', 'B', 'C'],
        matchMode: FilterMatchMode.IN,
      };
      const result = getDisplayValue(constraint, 'In', dateConditions);
      expect(result).toBe('A, B, C');
    });

    test('joins numeric arrays with commas', () => {
      const constraint: DataTableFilterMetaData = {
        value: [1, 2, 3],
        matchMode: FilterMatchMode.IN,
      };
      const result = getDisplayValue(constraint, 'In', dateConditions);
      expect(result).toBe('1, 2, 3');
    });

    test('returns empty string for empty arrays', () => {
      const constraint: DataTableFilterMetaData = {
        value: [],
        matchMode: FilterMatchMode.IN,
      };
      const result = getDisplayValue(constraint, 'In', dateConditions);
      expect(result).toBe('');
    });
  });

  describe('when handling date-related conditions', () => {
    test('formats valid date strings into en-CA locale', () => {
      const constraint: DataTableFilterMetaData = {
        value: '2024-06-12T00:00:00Z',
        matchMode: FilterMatchMode.DATE_IS,
      };
      const result = getDisplayValue(constraint, 'Date is', dateConditions);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('returns "Invalid Date" for invalid date strings', () => {
      const constraint: DataTableFilterMetaData = {
        value: 'not-a-real-date',
        matchMode: FilterMatchMode.DATE_IS,
      };
      const result = getDisplayValue(constraint, 'Date is', dateConditions);
      expect(result).toBe('Invalid Date');
    });

    test('does not attempt date formatting for non-date conditions', () => {
      const constraint: DataTableFilterMetaData = {
        value: '2024-06-12',
        matchMode: FilterMatchMode.EQUALS,
      };
      const result = getDisplayValue(constraint, 'Equals', dateConditions);
      expect(result).toBe('2024-06-12');
    });
  });

  describe('when handling custom filters', () => {
    test('returns null for matchMode CUSTOM', () => {
      const constraint: DataTableFilterMetaData = {
        value: 'CustomValue',
        matchMode: FilterMatchMode.CUSTOM,
      };
      const result = getDisplayValue(constraint, 'Custom', dateConditions);
      expect(result).toBeNull();
    });
  });

  describe('when handling nullish and undefined values', () => {
    test('returns "undefined" for undefined values', () => {
      const constraint: DataTableFilterMetaData = {
        value: undefined,
        matchMode: FilterMatchMode.EQUALS,
      };
      const result = getDisplayValue(constraint, 'Equals', dateConditions);
      expect(result).toBe('undefined');
    });

    test('returns "null" for null values', () => {
      const constraint: DataTableFilterMetaData = {
        value: null,
        matchMode: FilterMatchMode.EQUALS,
      };
      const result = getDisplayValue(constraint, 'Equals', dateConditions);
      expect(result).toBe('null');
    });
  });

  describe('when handling malformed inputs', () => {
    test('returns stringified value when matchMode is undefined', () => {
      const constraint: DataTableFilterMetaData = {
        value: 'Orphan value',
        matchMode: undefined,
      };
      const result = getDisplayValue(constraint, 'Equals', dateConditions);
      expect(result).toBe('Orphan value');
    });

    test('returns stringified object when value is an object', () => {
      const constraint: DataTableFilterMetaData = {
        value: { a: 1 },
        matchMode: FilterMatchMode.EQUALS,
      };
      const result = getDisplayValue(constraint, 'Equals', dateConditions);
      expect(result).toBe('[object Object]');
    });
  });
});

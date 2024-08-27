import { DataTableFilterMeta } from 'primereact/datatable';
import { FilterMatchMode } from 'primereact/api';
import { generateDateFilterString } from '../../../src/utilities/helperUtils';

describe('generateDateFilterString', () => {
  describe('when given a valid date object', () => {
    test('produces a correctly formatted filter string with field, condition, and ISO date', () => {
      const dateObject: DataTableFilterMeta = {
        createdAt: {
          matchMode: FilterMatchMode.DATE_AFTER,
          value: new Date('2023-07-23T00:00:00Z'),
        },
      };
      const expectedOutput = 'SSKV>=createdAt|2023-07-23T00:00:00.000Z';
      const result = generateDateFilterString(dateObject);
      expect(result).toBe(expectedOutput);
    });
  });

  describe('when given an empty date object', () => {
    test('returns an empty string', () => {
      const dateObject: DataTableFilterMeta = {};
      const expectedOutput = '';
      const result = generateDateFilterString(dateObject);
      expect(result).toBe(expectedOutput);
    });
  });

  describe('when given a date object with missing fields', () => {
    test('returns an empty string if required fields are absent', () => {
      const dateObject: DataTableFilterMeta = {
        createdAt: {
          matchMode: FilterMatchMode.DATE_AFTER,
          // Missing value field
        } as any,
      };
      const expectedOutput = '';
      const result = generateDateFilterString(dateObject);
      expect(result).toBe(expectedOutput);
    });
  });

  describe('when given a date object with an invalid date value', () => {
    test('returns an empty string for non-date values', () => {
      const dateObject: DataTableFilterMeta = {
        createdAt: {
          matchMode: FilterMatchMode.DATE_AFTER,
          value: 'invalid-date' as any,
        },
      };
      const expectedOutput = '';
      const result = generateDateFilterString(dateObject);
      expect(result).toBe(expectedOutput);
    });
  });

  describe('when given a date object with operator type', () => {
    test('produces a correctly formatted filter string for the first constraint', () => {
      const dateObject: DataTableFilterMeta = {
        createdAt: {
          operator: 'and',
          constraints: [
            {
              matchMode: FilterMatchMode.DATE_AFTER,
              value: new Date('2023-07-23T00:00:00Z'),
            },
          ],
        },
      };
      const expectedOutput = 'SSKV>=createdAt|2023-07-23T00:00:00.000Z';
      const result = generateDateFilterString(dateObject);
      expect(result).toBe(expectedOutput);
    });
  });

  describe('when given a date object with unsupported matchMode', () => {
    test('returns an empty string', () => {
      const dateObject: DataTableFilterMeta = {
        createdAt: {
          matchMode: FilterMatchMode.BETWEEN,
          value: new Date('2023-07-23T00:00:00Z'),
        },
      };
      const expectedOutput = '';
      const result = generateDateFilterString(dateObject);
      expect(result).toBe(expectedOutput);
    });
  });
});
